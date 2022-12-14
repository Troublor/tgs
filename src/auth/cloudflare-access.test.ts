import { CloudflareAccessGuard } from './cloudflare-access.guard';
import { Logger } from 'winston';
import { ExecutionContext } from '@nestjs/common';
import User from '../database/entities/User.entity.js';
import { any, mock, mockDeep } from 'jest-mock-extended';
import { DataSource, Repository } from 'typeorm';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Request } from 'express-serve-static-core';

const jwtHeader =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6ImNiMWFjNmQ0OWNhMjhlZjJkZmM4YTlhZjg2MjgyODZhNmMwZjVlMTVkNmQyNWU3NzA0NTZjNDNiMzgwN2VkN2UifQ';
const jwtPayload =
  'eyJhdWQiOlsiYWY5MTllODI0MzJkNmMyMmU2MGZhODQ3Nzg1M2MwZmE3ZjgzMzc4NDhkMzQ3MDUzZDIzMWIxOGUwYjZhZTZlMCJdLCJlbWFpbCI6InRyb3VibG9yQGxpdmUuY29tIiwiZXhwIjoxNjYyOTA0NDkyLCJpYXQiOjE2NjI4MTgwOTIsIm5iZiI6MTY2MjgxODA5MiwiaXNzIjoiaHR0cHM6Ly90cm91Ymxvci5jbG91ZGZsYXJlYWNjZXNzLmNvbSIsInR5cGUiOiJhcHAiLCJpZGVudGl0eV9ub25jZSI6IjduSHVmUmw1VWxrYVN2VUkiLCJzdWIiOiI3ODFjNWZiYi1mODY4LTQyMWMtYjZmNC0zOWNlYzJmYjVmOTQiLCJjb3VudHJ5IjoiVVMifQ';
const jwtSignature =
  'T3_xfcS6xkP--jC0GjuWbjs2K0S0Hizw90jNoCgl11fZKVpx8g5_q-1m8qJMzQFnIoyIIdhKnEk9dghpg8srkoqbJTAWy5S6S_eLSVoaOkNxtaaOSc65nutz9c44jnj6oWfiCu-quK_dY8vnO_d1mQZGEW7Pxbu9m7gFe-TwppDy9t8oHvfd4flHAD2OjNowgTXiO1CcMqGuu3b311mL0uA7fQ_azWo6UT9JUU5ALNYJlElZpkcloItXd_DvoomWniTi7OXGxedErPX3ByzP3lyZpWmOZINOELzfwP8A3FyYc7Q1zy-pk-sqP3gqr0xcpWEdb041d4uQ-2hTxix7DA';

describe('Cloudflare Access Guard', () => {
  describe('Private Guard', () => {
    let guard: CloudflareAccessGuard;

    beforeEach(() => {
      const logger = mock<Logger>();
      const repository = mock<Repository<User>>();
      repository.findOne.mockReturnValue(Promise.resolve(new User()));
      const dataSource = mockDeep<DataSource>({ funcPropSupport: true });
      dataSource.getRepository.mockReturnValue(repository);
      guard = new CloudflareAccessGuard(
        logger,
        dataSource as unknown as DataSource,
      );
    });

    it('should authenticate only my own access', async () => {
      const request = mock<Request>();
      request.header.calledWith(any()).mockReturnValue(undefined);
      request.header
        .calledWith('Cf-Access-Jwt-Assertion')
        .mockReturnValue([jwtHeader, jwtPayload, jwtSignature].join('.'));
      const httpArgs = mock<HttpArgumentsHost>();
      httpArgs.getRequest.mockReturnValue(request);
      const mockExecutionContext = mock<ExecutionContext>();
      mockExecutionContext.switchToHttp.mockReturnValue(httpArgs);
      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it.each([
      ['invalid jwt'],
      [[jwtSignature, jwtPayload, jwtHeader].join('.')],
      [[jwtHeader, jwtPayload].join('.')],
      [[jwtHeader, jwtSignature].join('.')],
      [[jwtHeader, jwtPayload + 'nonce', jwtSignature].join('.')],
      [[jwtHeader, jwtPayload, jwtSignature, 'extra'].join('.')],
    ])('should not authenticate invalid jwt', async (jwt) => {
      const request = mock<Request>();
      request.header.calledWith(any()).mockReturnValue(undefined);
      request.header.calledWith('Cf-Access-Jwt-Assertion').mockReturnValue(jwt);
      const httpArgs = mock<HttpArgumentsHost>();
      httpArgs.getRequest.mockReturnValue(request);
      const mockExecutionContext = mock<ExecutionContext>();
      mockExecutionContext.switchToHttp.mockReturnValue(httpArgs);
      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(false);
    });
  });
});
