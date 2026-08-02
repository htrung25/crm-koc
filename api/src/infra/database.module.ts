import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import { DataSource, DataSourceOptions } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { AuthEntity } from '../module/auth/entities/auth.entity';
import { ProfileEntity } from '../module/admin/entities/profile.entity';
import { SessionEventEntity } from '../module/auth/entities/session-event.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseURL = config.get<string>('DATABASE_URL');
        const isTsRunTime = __filename.endsWith('.ts');
        const migrationGlobals = isTsRunTime
          ? ['migrations/*.ts']
          : ['dist/migrations/*.js'];
        if (databaseURL) {
          return {
            type: 'postgres',
            url: databaseURL,
            entities: [AuthEntity, ProfileEntity, SessionEventEntity],
            migrations: migrationGlobals,
            migrationsRun: false,
            synchronize: false,
            logging: ['error', 'schema'],
            namingStrategy: new SnakeNamingStrategy(),
          };
        }

        const host = config.get<string>('DATABASE_HOST', 'localhost');
        const port = config.get<number>('DATABASE_PORT', 5432);
        const username = config.get<string>('DATABASE_USERNAME', 'postgres');
        const password = config.get<string>('DATABASE_PASSWORD', '');
        const database = config.get<string>('DATABASE_NAME', 'crm_koc');
        const sslEnabled =
          config.get<string>('DATABASE_SSL_ENABLED', 'false') === 'true';

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities: [AuthEntity, ProfileEntity, SessionEventEntity],
          migrations: migrationGlobals,
          migrationsRun: false,
          synchronize: false,
          logging: ['error', 'schema'],
          namingStrategy: new SnakeNamingStrategy(),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        };
      },
      // Bọc DataSource lại để typeorm-transactional lái được mọi repository
      // vào transaction đang chạy. Thiếu bước này thì @Transactional() vô tác dụng.
      dataSourceFactory: (options?: DataSourceOptions) => {
        if (!options) {
          throw new Error('Thiếu DataSourceOptions');
        }
        return Promise.resolve(
          addTransactionalDataSource(new DataSource(options)),
        );
      },
    }),
  ],
  providers: [],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('Database connected');
    } catch (err) {
      this.logger.error('Database connected failed: ', err);
      throw err;
    }
  }
}
