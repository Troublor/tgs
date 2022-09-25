import rawBody from 'raw-body';
import {
  createParamDecorator,
  ExecutionContext,
  NotAcceptableException,
} from '@nestjs/common';

export const PlainBody = createParamDecorator(
  async (_, context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest<import('express').Request>();
    if (!req.readable) {
      throw new NotAcceptableException('body is not text/plain');
    }

    return (await rawBody(req)).toString('utf8').trim();
  },
);
