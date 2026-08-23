// import {
//   Injectable,
//   Logger,
//   OnModuleDestroy,
//   OnModuleInit,
// } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { Consumer, Kafka, KafkaConfig, Producer, SASLOptions } from 'kafkajs';

// @Injectable()
// export class KafkaService implements OnModuleInit, OnModuleDestroy {
//   private readonly logger = new Logger(KafkaService.name);
//   private kafka: Kafka | null = null;
//   private producer: Producer | null = null;
//   private readonly consumers: Consumer[] = [];

//   constructor(private readonly configService: ConfigService) {}

//   async onModuleInit(): Promise<void> {
//     // Nếu không khai báo KAFKA_ENABLED thì mặc định là "true" để dev đỡ phải cấu hình nhiều
//     const enabledEnv = this.configService.get<string>('KAFKA_ENABLED');
//     const enabled = enabledEnv ? enabledEnv === 'true' : true;

//     if (!enabled) {
//       this.logger.log('Kafka is disabled via KAFKA_ENABLED env');
//       return;
//     }

//     let brokersRaw =
//       this.configService.get<string>('KAFKA_CLUSTER_IPS') ??
//       this.configService.get<string>('KAFKA_BROKERS') ??
//       this.configService.get<string>('KAFKA_BROKER');

//     // Hỗ trợ trường hợp env có comment inline: "ip1,ip2 # DEV"
//     if (brokersRaw) {
//       brokersRaw = brokersRaw.split('#')[0].trim();
//     }

//     if (!brokersRaw) {
//       this.logger.warn(
//         'Kafka enabled nhưng không có KAFKA_CLUSTER_IPS/KAFKA_BROKERS/KAFKA_BROKER, bỏ qua init Kafka',
//       );
//       return;
//     }

//     const port = this.configService.get<string>('KAFKA_PORT') ?? '9092';
//     const clientId =
//       this.configService.get<string>('KAFKA_CLIENT_ID') ?? 'starpay-admin';

//     const hosts = brokersRaw
//       .split(',')
//       .map((h) => h.trim())
//       .filter(Boolean)
//       .map((host) => (host.includes(':') ? host : `${host}:${port}`));

//     const saslUser = this.configService.get<string>('KAFKA_USERNAME');
//     const saslPass = this.configService.get<string>('KAFKA_PASSWORD');
//     const saslMechanism = this.configService.get<string>(
//       'KAFKA_SASL_MECHANISM',
//     ) as SASLOptions['mechanism'] | undefined;

//     const config: KafkaConfig = {
//       clientId,
//       brokers: hosts,
//     };

//     if (saslUser && saslPass && saslMechanism) {
//       config.sasl = {
//         mechanism: saslMechanism,
//         username: saslUser,
//         password: saslPass,
//       } as SASLOptions;
//       config.ssl = true;
//     }

//     this.kafka = new Kafka(config);
//     this.producer = this.kafka.producer();

//     try {
//       await this.producer.connect();
//       this.logger.log(
//         `Kafka producer connected to brokers: ${hosts.join(', ')}`,
//       );
//     } catch (error) {
//       this.logger.error('Failed to connect Kafka producer', error as Error);
//       this.kafka = null;
//       this.producer = null;
//     }
//   }

//   async onModuleDestroy(): Promise<void> {
//     if (this.producer) {
//       await this.producer.disconnect();
//       this.logger.log('Kafka producer disconnected');
//     }
//     await Promise.all(this.consumers.map((c) => c.disconnect()));
//   }

//   /**
//    * Gửi message lên Kafka topic.
//    * Nếu Kafka chưa được enable/kết nối, hàm sẽ log warning và return mà không throw.
//    */
//   async sendMessage(
//     topic: string,
//     payload: unknown,
//     key?: string,
//   ): Promise<void> {
//     if (!this.producer) {
//       this.logger.warn(
//         `Kafka producer not initialized, skip sending to topic=${topic}`,
//       );
//       return;
//     }

//     try {
//       await this.producer.send({
//         topic,
//         messages: [
//           {
//             key,
//             value: JSON.stringify(payload),
//           },
//         ],
//       });
//     } catch (error) {
//       this.logger.error(
//         `Failed to send message to topic=${topic}`,
//         error as Error,
//       );
//     }
//   }

//   /**
//    * Subscribe 1 consumer group vào 1 topic, xử lý từng message qua handler.
//    * Nếu Kafka chưa được enable/kết nối, hàm sẽ log warning và return mà không throw
//    * (consumer sẽ không nhận được message nào, nhưng app vẫn chạy bình thường).
//    */
//   async subscribe(
//     topic: string,
//     groupId: string,
//     handler: (payload: any, key?: string) => Promise<void>,
//   ): Promise<void> {
//     if (!this.kafka) {
//       this.logger.warn(
//         `Kafka not initialized, skip subscribing to topic=${topic}`,
//       );
//       return;
//     }

//     const consumer = this.kafka.consumer({ groupId });
//     await consumer.connect();
//     await consumer.subscribe({ topic, fromBeginning: false });
//     this.consumers.push(consumer);

//     await consumer.run({
//       eachMessage: async ({ message }) => {
//         try {
//           const payload = message.value
//             ? JSON.parse(message.value.toString())
//             : null;
//           await handler(payload, message.key?.toString());
//         } catch (error) {
//           this.logger.error(
//             `Failed to process message from topic=${topic}`,
//             error as Error,
//           );
//         }
//       },
//     });

//     this.logger.log(
//       `Kafka consumer subscribed: topic=${topic} groupId=${groupId}`,
//     );
//   }
// }
