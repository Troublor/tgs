import { NestFactory } from '@nestjs/core';
import AppModule from './app.module.js';
import checkDependencies from './system-dependency.js';
import { ConfigService } from '@nestjs/config';
import Config from './config/schema.js';

async function bootstrap() {
  checkDependencies();

  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get<ConfigService<Config, true>>(ConfigService);
  await app.listen(configService.get('port', { infer: true }));
}

bootstrap();
