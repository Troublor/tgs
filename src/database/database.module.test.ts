import DatabaseModule from './database.module.js';
import { mock, mockFn } from 'jest-mock-extended';
import winston from 'winston';
import BackupService from './backup.service.js';
import { DataSource, Repository } from 'typeorm';
import { jest } from '@jest/globals';
import User from './entities/User.entity.js';

describe('DatabaseModule', () => {
  describe('Unit Tests', () => {
    let module: DatabaseModule;
    let backupService: ReturnType<typeof mock<BackupService>>;
    let dataSource: ReturnType<typeof mock<DataSource>>;
    beforeEach(() => {
      process.exit = mockFn<typeof process.exit>().mockImplementation(() => {
        throw new Error('exit');
      });
      const logger = mock<winston.Logger>();
      logger.error.mockReturnValue(logger);
      logger.child.mockReturnValue(logger);
      backupService = mock<BackupService>();
      dataSource = mock<DataSource>();
      module = new DatabaseModule(
        logger,
        backupService,
        dataSource as unknown as DataSource,
      );
    });

    it('should start backup service on module init when there is at least one user in database', async () => {
      dataSource.getRepository.mockImplementation(() => {
        const repo = mock<Repository<User>>();
        repo.find.mockReturnValue(Promise.resolve([new User()]));
        return repo;
      });
      const start = jest.spyOn(backupService, 'start');
      await module.onModuleInit();
      expect(start).toHaveBeenCalled();
    });

    it('should not start backup service and exit when there is no user in database', async () => {
      dataSource.getRepository.mockImplementation(() => {
        const repo = mock<Repository<User>>();
        repo.find.mockReturnValue(Promise.resolve([]));
        return repo;
      });
      const start = jest.spyOn(backupService, 'start');
      const exit = jest.spyOn(process, 'exit');
      try {
        await module.onModuleInit();
      } catch (_) {}
      expect(start).not.toHaveBeenCalled();
      expect(exit).toHaveBeenCalled();
    });
  });
});
