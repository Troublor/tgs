import { Module } from '@nestjs/common';
import { CloudflareAccessPrivateGuard } from './cloudflare-access.guard';
import { WinstonModule } from 'nest-winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'info',
    }),
  ],
  providers: [CloudflareAccessPrivateGuard],
  exports: [CloudflareAccessPrivateGuard],
})
export default class AuthModule {}
