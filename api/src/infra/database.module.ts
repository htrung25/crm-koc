import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SnakeNamingStrategy } from './snake-naming.strategy';
import { DataSource } from 'typeorm';

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
            entities: [],
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
          entities: [],
          migrations: migrationGlobals,
          migrationsRun: false,
          synchronize: false,
          logging: ['error', 'schema'],
          namingStrategy: new SnakeNamingStrategy(),
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        };
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
