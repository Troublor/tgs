import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import loadConfig from './config/config.js';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import Config from './config/schema.js';
import UserModule from './user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [loadConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: buildTypeORMDataSource,
      inject: [ConfigService],
    }),
    UserModule,
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
