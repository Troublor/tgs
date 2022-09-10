import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

/**
 * Guard that only grant access to my own.
 */
@Injectable()
export class CloudflareAccessPrivateGuard implements CanActivate {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();
    // Jwt format can be found in https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/application-token/
    const cfJwt = req.header('Cf-Access-Jwt-Assertion');
    if (!cfJwt) return false;
    try {
      const token = parseApplicationToken(cfJwt);
      return token.payload.email === 'troublor@live.com';
    } catch (e: unknown) {
      this.logger.info('Failed to parse application token', e);
      return false;
    }
  }
}

function parseApplicationToken(token: string): ApplicationToken {
  const sections = token.split('.');
  if (sections.length !== 3) {
    throw new Error('invalid application token: not three parts');
  }
  let header: ApplicationTokenHeader;
  try {
    header = JSON.parse(Buffer.from(sections[0], 'base64').toString('utf-8'));
  } catch (e: unknown) {
    throw new Error(`failed to parse application token header: ${e}`);
  }
  let payload: ApplicationTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(sections[1], 'base64').toString('utf-8'));
  } catch (e: unknown) {
    throw new Error(`failed to parse application token payload: ${e}`);
  }
  let signature: Buffer;
  try {
    signature = Buffer.from(sections[2], 'base64');
  } catch (e: unknown) {
    throw new Error(`failed to parse application token signature: ${e}`);
  }
  return {
    header,
    payload,
    signature,
  };
}

export interface ApplicationToken {
  header: ApplicationTokenHeader;
  payload: ApplicationTokenPayload;
  signature: Buffer;
}

export interface ApplicationTokenHeader {
  alg: string;
  kid: string;
  typ: 'JWT';
}

export interface ApplicationTokenPayload {
  aud: string[];
  email: string;
  exp: number;
  iat: number;
  nbf: number;
  iss: string;
  type: 'app' | 'org';
  identity_nonce: string;
  sub: string;
  country: string;
}
