import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka, KafkaConfig, Producer, SASLOptions } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private readonly consumers: Consumer[] = [];

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
      this.configService.get<string>('KAFKA_CLIENT_ID') ?? 'starpay-admin';
    const brokers = brokersRaw
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean)
      .map((host) => (host.includes(':') ? host : `${host}:${port}`));

    const config: KafkaConfig = { clientId, brokers };
    const username = this.configService.get<string>('KAFKA_USERNAME');
    const password = this.configService.get<string>('KAFKA_PASSWORD');
    const mechanism = this.configService.get<string>('KAFKA_SASL_MECHANISM') as
      SASLOptions['mechanism'] | undefined;

    if (username && password && mechanism) {
      config.ssl = true;
      config.sasl = { mechanism, username, password } as SASLOptions;
    }

    this.kafka = new Kafka(config);
    this.producer = this.kafka.producer();

    try {
      await this.producer.connect();
      this.logger.log(`Kafka producer connected: ${brokers.join(', ')}`);
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error as Error);
      this.producer = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled(
      this.consumers.map((consumer) => consumer.disconnect()),
    );
    if (this.producer) {
      await this.producer.disconnect();
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
