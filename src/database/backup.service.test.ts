import BackupService from './backup.service.js';
import {
  anyString,
  Matcher,
  MatcherCreator,
  mock,
  mockFn,
} from 'jest-mock-extended';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import RCloneService from '../netdrive/rclone.service.js';
import { jest } from '@jest/globals';
import fs from 'fs';
import child_process from 'child_process';
import { mockConfigService, mockLogger, mockSpawn } from '../utils/mocking.js';

// expectedValue is optional
export const stringMatch: MatcherCreator<string, string | RegExp> = (
  expectedValue,
) =>
  new Matcher((actualValue) => {
    if (typeof expectedValue === 'string') {
      return actualValue === expectedValue;
    } else if (expectedValue instanceof RegExp) {
      return expectedValue.test(actualValue);
    } else {
      return anyString().asymmetricMatch(actualValue);
    }
  }, `stringMatch(${expectedValue})`);
describe('BackupService', () => {
  beforeAll(() => {
    jest.mock('fs');
    jest.mock('child_process');
    fs.promises.mkdtemp = mockFn().mockReturnValue(Promise.resolve('tmp'));
    fs.promises.rm = mockFn();
    child_process.spawn = mockSpawn(0);
  });
  afterAll(() => jest.clearAllMocks());

  let backupService: BackupService;
  let configService: ReturnType<typeof mock<ConfigService>>;
  let rcloneService: ReturnType<typeof mock<RCloneService>>;
  beforeEach(() => {
    const logger = mockLogger();
    configService = mockConfigService({
      'database.backupInterval': 100,
      mode: 'development',
      'database.netDriveBackupFolder': 'TEMP',
    });
    const dataSource = mock<DataSource>();
    rcloneService = mock<RCloneService>();
    backupService = new BackupService(
      logger,
      configService,
      dataSource,
      rcloneService,
    );
  });

  it('should backup periodically according to config', async () => {
    const sync = jest.spyOn(rcloneService, 'sync');
    backupService.start();
    await new Promise((resolve) => setTimeout(resolve, 250));
    backupService.stop();
    expect(sync).toHaveBeenCalledTimes(3);
  });

  it('should should backup periodically even if some backup errors', async () => {
    child_process.spawn = mockSpawn(0, 1, 0);
    const sync = jest.spyOn(rcloneService, 'sync');
    backupService.start();
    await new Promise((resolve) => setTimeout(resolve, 250));
    backupService.stop();
    expect(sync).toHaveBeenCalledTimes(2);
  });

  it('should call spawn when backup and cleanup after finish', async () => {
    const spawn = jest.spyOn(child_process, 'spawn');
    const rm = jest.spyOn(fs.promises, 'rm');
    await backupService.backup();
    expect(spawn).toBeCalled();
    expect(rm).toBeCalled();
  });

  it('should cleanup when error occurs', async () => {
    child_process.spawn = mockSpawn(1);
    const rm = jest.spyOn(fs.promises, 'rm');
    await backupService.backup();
    expect(rm).toBeCalled();
  });
});
