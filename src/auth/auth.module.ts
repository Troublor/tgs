import { Module } from '@nestjs/common';
import { CloudflareAccessGuard } from './cloudflare-access.guard';
import PrivateGuard from './private.guard.js';

@Module({
  providers: [CloudflareAccessGuard, PrivateGuard],
  exports: [CloudflareAccessGuard, PrivateGuard],
})
export default class AuthModule {}
