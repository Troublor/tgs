import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import RequestWithUser from './request.js';

@Injectable()
export default class PrivateGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req: RequestWithUser = context.switchToHttp().getRequest();
    return req.user.email === 'troublor@live.com';
  }
}
