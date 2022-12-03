import { mock } from 'jest-mock-extended';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ExecutionContext } from '@nestjs/common';
import RequestWithUser from './request';
import PrivateGuard from './private.guard';

describe('PrivateGuard', () => {
  it('should allow access from me', () => {
    const request = mock<RequestWithUser>();
    request.user.email = 'troublor@live.com';
    const httpArgs = mock<HttpArgumentsHost>();
    httpArgs.getRequest.mockReturnValue(request);
    const mockExecutionContext = mock<ExecutionContext>();
    mockExecutionContext.switchToHttp.mockReturnValue(httpArgs);
    const guard = new PrivateGuard();
    expect(guard.canActivate(mockExecutionContext)).toBeTruthy();
  });

  it('should allow access from me', () => {
    const request = mock<RequestWithUser>();
    request.user.email = 'troublor@live.com';
    const httpArgs = mock<HttpArgumentsHost>();
    httpArgs.getRequest.mockReturnValue(request);
    const mockExecutionContext = mock<ExecutionContext>();
    mockExecutionContext.switchToHttp.mockReturnValue(httpArgs);
    const guard = new PrivateGuard();
    expect(guard.canActivate(mockExecutionContext)).toBeTruthy();
  });
});
