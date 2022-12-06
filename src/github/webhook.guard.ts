import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import RequestWithUser from '../auth/request.js';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import * as crypto from 'crypto';
import { Constructor } from 'type-fest';

export function WebhookGuardFactory(
  secretConfigPath: string,
): Constructor<CanActivate> {
  @Injectable()
  class webhookGuard implements CanActivate {
    constructor(private readonly configService: ConfigService<Config, true>) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
      const req: RequestWithUser = context.switchToHttp().getRequest();
      // webhook header defined in https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads
      const signature = req.header('X-Hub-Signature-256');
      if (!signature) return false;
      const sigHashAlg = 'sha256';
      const secret = this.configService.get<string>(
        secretConfigPath as keyof Config,
      );
      const hmac = crypto.createHmac(sigHashAlg, secret);
      const digest = Buffer.from(
        sigHashAlg + '=' + hmac.update(req.body).digest('hex'),
        'utf8',
      );
      const sig = Buffer.from(signature, 'utf8');
      return !(
        sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)
      );
    }
  }

  return webhookGuard;
}
