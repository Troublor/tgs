import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import loadConfig from './config/config.js';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import Config from './config/schema.js';
import NetDriveModule from './netdrive/netdrive.module.js';
import HLedgerModule from './hledger/hledger.module.js';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import Transport from 'winston-transport';
import DatabaseModule from './database/database.module.js';
import MessageModule from './message/message.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loadConfig],
      isGlobal: true,
    }),
    WinstonModule.forRootAsync({
      useFactory: (config: ConfigService<Config, true>) => {
        const transports: Transport[] = [new winston.transports.Console()];
        if (config.get('log.file', { infer: true })) {
          transports.push(
            new winston.transports.File({
              filename: config.get('log.file', { infer: true }),
            }),
          );
        }
        return {
          level: config.get('log.level', { infer: true }),
          transports: transports,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: buildTypeORMDataSource,
      inject: [ConfigService],
    }),
    DatabaseModule,
    MessageModule,
    NetDriveModule,
    HLedgerModule,
  ],
})
export default class AppModule {}

async function buildTypeORMDataSource(
  config: ConfigService<Config, true>,
): Promise<TypeOrmModuleOptions> {
  return {
    type: 'postgres',
    host: config.get('database.host', { infer: true }),
    port: config.get('database.port', { infer: true }),
    username: config.get('database.username', { infer: true }),
    password: config.get('database.password', { infer: true }),
    database: config.get('database.database', { infer: true }),

    autoLoadEntities: true,
    synchronize: config.get('mode', { infer: true }) === 'development',
  };
}
