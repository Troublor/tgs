import fs from 'fs';
import winston from 'winston';
import RCloneService from './rclone.service.js';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import path from 'path';
import { mock } from 'jest-mock-extended';
import { jest } from '@jest/globals';
import child_process from 'child_process';
import { mockSpawn } from '../utils/mocking.js';

describe('rclone service', () => {
  const rcloneConfigPath = process.env.TGS_RCLONE_CONFIG;
  const hasConfig = rcloneConfigPath ? fs.existsSync(rcloneConfigPath) : false;

  const describeIf = (condition: boolean) =>
    condition ? describe : describe.skip;

  describeIf(hasConfig)('with config', () => {
    const mockLogger = winston.createLogger({ silent: true });
    const mockConfigService = mock<ConfigService>();
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'netDrive.rcloneConfigPath':
          return rcloneConfigPath;
        case 'netDrive.rcloneRemote':
          return 'OneDrive';
        default:
          throw new Error(`unexpected key ${key}`);
      }
    });

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

  describe('without config', () => {
    beforeAll(() => {
      child_process.spawn = mockSpawn(0);
    });
    afterAll(() => jest.clearAllMocks());

    let rcloneService: ReturnType<typeof mock<RCloneService>>;
    let configService: ReturnType<typeof mock<ConfigService<Config, true>>>;
    beforeEach(() => {
      const logger = mock<winston.Logger>();
      logger.child.mockReturnValue(logger);
      configService = mock<ConfigService<Config, true>>();
      rcloneService = mock<RCloneService>(
        new RCloneService(configService, logger),
      );
    });

    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'netDrive.rcloneConfigPath':
            return '';
          case 'netDrive.rcloneRemote':
            return '';
          default:
            throw new Error(`unexpected key ${key}`);
        }
      });
    });

    it('should touch fish when checking health', async () => {
      const touch = jest.spyOn(rcloneService, 'touch');
      await rcloneService.checkHealth();
      expect(touch).toBeCalledWith(rcloneService.mkRemotePath('.fish'));
    });

    it('should return false when checking health and failed', async () => {
      child_process.spawn = mockSpawn(1);
      expect(await rcloneService.checkHealth()).toBe(false);
    });

    it.each([
      ['mountFolder', 'rclone', 'mount'],
      ['unmountFolder', 'umount', undefined],
      ['sync', 'rclone', 'sync'],
      ['touch', 'rclone', 'touch'],
      ['bisync', 'rclone', 'bisync'],
    ])(
      'should call rclone command accordingly',
      async (fn: string, cmd: string, arg0: string | undefined) => {
        child_process.spawn = mockSpawn(0);
        const spawn = jest.spyOn(child_process, 'spawn');
        const f = rcloneService[fn as keyof RCloneService];
        await f.bind(rcloneService)();
        expect(spawn).toBeCalled();
        expect(spawn.mock.calls[0][0]).toBe(cmd);
        if (arg0) {
          expect(spawn.mock.calls[0][1][0]).toBe(arg0);
        }
      },
    );

    it.each([
      ['mountFolder'],
      ['unmountFolder'],
      ['sync'],
      ['touch'],
      ['bisync'],
    ])('should throw error when spawn fails', async (fn: string) => {
      child_process.spawn = mockSpawn(1);
      const f = rcloneService[fn as keyof RCloneService];
      await expect(f.bind(rcloneService)()).rejects.toBeInstanceOf(Error);
    });
  });
});
