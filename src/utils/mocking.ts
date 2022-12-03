import { mock, mockDeep, mockFn } from 'jest-mock-extended';
import child_process from 'child_process';
import winston from 'winston';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';

export type MockOf<T> = ReturnType<typeof mock<T>>;
export type MockDeepOf<T> = ReturnType<typeof mockDeep<T>>;
// eslint-disable-next-line @typescript-eslint/ban-types
export type MockFnOf<T extends Function> = ReturnType<typeof mockFn<T>>;

export function mockSpawn(...exitCode: number[]) {
  const fn =
    exitCode.length === 1 ? 'mockImplementation' : 'mockImplementationOnce';
  const m = mockFn();
  let tmp = m;
  for (const code of exitCode) {
    tmp = tmp[fn](() => {
      const p = mock<child_process.ChildProcess>();
      p.on.mockImplementation((event, cb: (c: number) => void) => {
        cb(code);
        return p;
      });
      return p;
    });
  }
  return m;
}

export function mockConfigService(
  configOrHandler: Record<string, unknown> | ((key: string) => unknown),
) {
  const configService = mockDeep<ConfigService<Config, true>>();
  configService.get.mockImplementation((key: string) => {
    if (typeof configOrHandler === 'function') {
      return configOrHandler(key);
    } else if (typeof configOrHandler === 'object') {
      return configOrHandler[key];
    } else {
      return undefined;
    }
  });
  return configService;
}

export function mockLogger() {
  const logger = mock<winston.Logger>();
  logger.info.mockReturnValue(logger);
  logger.debug.mockReturnValue(logger);
  logger.error.mockReturnValue(logger);
  logger.child.mockReturnValue(logger);
  return logger;
}
