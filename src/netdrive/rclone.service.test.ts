import fs from 'fs';
import winston from 'winston';
import RCloneService from './rclone.service.js';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import path from 'path';

describe('rclone service', () => {
  const rcloneConfigPath = process.env.TGS_RCLONE_CONFIG;
  const hasConfig = rcloneConfigPath ? fs.existsSync(rcloneConfigPath) : false;

  if (!hasConfig) {
    console.warn('skipping rclone service tests: rclone config not found');
    return;
  }

  const describeIf = (condition: boolean) =>
    condition ? describe : describe.skip;

  const mockLogger = winston.createLogger({ silent: true });
  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      switch (key) {
        case 'netDrive.rcloneConfigPath':
          return rcloneConfigPath;
        case 'netDrive.rcloneRemote':
          return 'OneDrive';
        default:
          throw new Error(`unexpected key ${key}`);
      }
    }),
  } as unknown as ConfigService<Config, true>;

  describeIf(hasConfig)('with config', () => {
    it('should sync folder correctly', async () => {
      const rcloneService = new RCloneService(mockConfigService, mockLogger);
      const mountPoint = await fs.promises.mkdtemp('/tmp/tgs-test-');
      try {
        await rcloneService.sync('OneDrive:Database/test', mountPoint);
        const content = await fs.promises.readFile(
          path.join(mountPoint, 'test.txt'),
          'utf8',
        );
        expect(content.trim()).toBe('test content');
      } finally {
        await fs.promises.rm(mountPoint, { recursive: true });
      }
    }, 10000);

    it('should mount folder and umount correctly', async () => {
      const rcloneService = new RCloneService(mockConfigService, mockLogger);
      const mountPoint = await fs.promises.mkdtemp('/tmp/tgs-test-');
      try {
        await rcloneService.mountFolder('OneDrive:Database/test', mountPoint);
        const content = await fs.promises.readFile(
          path.join(mountPoint, 'test.txt'),
          'utf8',
        );
        expect(content.trim()).toBe('test content');
        await rcloneService.unmountFolder(mountPoint);
        expect(fs.existsSync(path.join(mountPoint, 'test.txt'))).toBe(false);
      } finally {
        await fs.promises.rm(mountPoint, { recursive: true });
      }
    }, 10000);
  });
});
