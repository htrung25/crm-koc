import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, KafkaConfig, Producer, SASLOptions } from 'kafkajs';

const RECONNECT_INTERVAL_MS = 15_000;

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private readonly consumers: Consumer[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isDestroyed = false;
  private brokers: string[] = [];

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const enabled = this.configService.get<string>('KAFKA_ENABLED');
    if (enabled !== undefined && enabled !== 'true') {
      this.logger.log('Kafka is disabled via KAFKA_ENABLED env');
      return;
    }

    let brokersRaw = this.configService.get<string>('KAFKA_BROKERS');

    if (brokersRaw) {
      brokersRaw = brokersRaw.split('#')[0].trim();
    }

    if (!brokersRaw) {
      this.logger.warn('Kafka brokers are not configured');
      return;
    }

    const port = this.configService.get<string>('KAFKA_PORT') ?? '9092';
    const clientId =
      this.configService.get<string>('KAFKA_CLIENT_ID') || 'crm-koc-api';
    this.brokers = brokersRaw
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean)
      .map((host) => (host.includes(':') ? host : `${host}:${port}`));

    const config: KafkaConfig = { clientId, brokers: this.brokers };
    const username = this.configService.get<string>('KAFKA_USERNAME');
    const password = this.configService.get<string>('KAFKA_PASSWORD');
    const mechanism = this.configService.get<string>('KAFKA_SASL_MECHANISM') as
      SASLOptions['mechanism'] | undefined;

    if (username && password && mechanism) {
      config.ssl = true;
      config.sasl = { mechanism, username, password } as SASLOptions;
    }

    this.kafka = new Kafka(config);
    await this.connectProducer();
  }

  private async connectProducer(): Promise<boolean> {
    if (!this.kafka || this.isConnecting || this.isDestroyed) {
      return false;
    }
    this.isConnecting = true;

    try {
      const producer = this.kafka.producer();
      await producer.connect();
      this.producer = producer;
      this.logger.log(`Kafka producer connected: ${this.brokers.join(', ')}`);
      this.clearReconnectTimer();
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to connect Kafka producer (${this.brokers.join(', ')}). Retrying in ${RECONNECT_INTERVAL_MS / 1000}s...`,
        error as Error,
      );
      this.producer = null;
      this.scheduleReconnect();
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isDestroyed || !this.kafka) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connectProducer();
    }, RECONNECT_INTERVAL_MS);

    if (this.reconnectTimer.unref) {
      this.reconnectTimer.unref();
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.isDestroyed = true;
    this.clearReconnectTimer();

    await Promise.allSettled(
      this.consumers.map((consumer) => consumer.disconnect()),
    );
    if (this.producer) {
      await this.producer.disconnect().catch((err: Error) => {
        this.logger.warn(`Error disconnecting Kafka producer: ${err.message}`);
      });
      this.producer = null;
    }
  }

  isEnabled(): boolean {
    return this.producer !== null;
  }

  async sendMessage(
    topic: string,
    payload: unknown,
    key?: string,
  ): Promise<void> {
    if (!this.producer) {
      this.logger.warn(`Kafka producer is unavailable, skip topic=${topic}`);
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [{ key, value: JSON.stringify(payload) }],
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish Kafka topic=${topic}`,
        error as Error,
      );
      this.producer = null;
      this.scheduleReconnect();
    }
  }

  async subscribe<T = unknown>(
    topic: string,
    groupId: string,
    handler: (payload: T, key?: string) => Promise<void>,
  ): Promise<void> {
    if (!this.kafka) {
      this.logger.warn(`Kafka is unavailable, skip topic=${topic}`);
      return;
    }

    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const payload = JSON.parse(message.value?.toString() ?? '{}') as T;
          await handler(payload, message.key?.toString());
        } catch (error) {
          this.logger.error(
            `Failed to process Kafka message topic=${topic}`,
            error as Error,
          );
        }
      },
    });
    this.consumers.push(consumer);
  }
}
