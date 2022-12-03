import LedgerFileService from './ledger-file.service.js';
import { mockConfigService, mockLogger, MockOf } from '../utils/mocking.js';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import RCloneService from '../netdrive/rclone.service.js';
import { mock, mockFn } from 'jest-mock-extended';
import fs from 'fs';
import { jest } from '@jest/globals';

describe('ledgerFileService', () => {
  beforeAll(() => jest.mock('fs'));
  afterAll(() => jest.clearAllMocks());

  let service: LedgerFileService;
  let configService: MockOf<ConfigService<Config, true>>;
  let rcloneService: MockOf<RCloneService>;
  beforeEach(() => {
    const logger = mockLogger();
    configService = mockConfigService({
      'hledger.bisyncInterval': 1000 * 60,
      'hledger.netDriveLedgerFilePath': 'remote:ledger.journal',
    });
    rcloneService = mock<RCloneService>();
    service = new LedgerFileService(logger, configService, rcloneService);
  });

  describe('checkHealth', () => {
    it('should return false before preparation', async () => {
      expect(await service.checkHealth()).toBe(false);
    });

    it('should return false when ledger file does not exist', async () => {
      fs.promises.access = mockFn().mockRejectedValue(new Error('not exist'));
      service.ledgerFilePath = 'ledger.journal';
      expect(await service.checkHealth()).toBe(false);
    });

    it('should return true when ledger file exists', async () => {
      fs.promises.access = mockFn().mockResolvedValue(undefined);
      service.ledgerFilePath = 'ledger.journal';
      expect(await service.checkHealth()).toBe(true);
    });
  });

  describe('start', () => {
    it('should return immediate when ledger file is set', async () => {
      service.ledgerFilePath = 'ledger.journal';
      await expect(service.start()).resolves.toBe('ledger.journal');
    });

    it('should touch and bisync ledger file', async () => {
      fs.promises.mkdtemp = mockFn().mockResolvedValue('tmp');
      const oldSetInterval = global.setInterval;
      global.setInterval = mockFn();
      const touch = jest.spyOn(rcloneService, 'touch');
      const bisync = jest.spyOn(rcloneService, 'bisync');
      await service.start();
      expect(touch).toBeCalled();
      expect(bisync).toBeCalled();
      global.setInterval = oldSetInterval;
    });

    it('should start periodic maintenance', async () => {
      fs.promises.mkdtemp = mockFn().mockResolvedValue('tmp');
      const oldSetInterval = global.setInterval;
      global.setInterval = mockFn();
      const setInterval = jest.spyOn(global, 'setInterval');
      await service.start();
      expect(setInterval).toBeCalled();
      global.setInterval = oldSetInterval;
    });
  });

  describe('maintenance', () => {
    it('should return immediately if ledger file path is not set', async () => {
      const bisync = jest.spyOn(rcloneService, 'bisync');
      await service.maintenance();
      expect(bisync).not.toBeCalled();
    });

    it('should call bisync', async () => {
      const bisync = jest.spyOn(rcloneService, 'bisync');
      service.ledgerFilePath = 'ledger.journal';
      await service.maintenance();
      expect(bisync).toBeCalled();
    });
  });

  describe('stop', () => {
    it('should remove local ledger file', async () => {
      fs.promises.rm = mockFn().mockResolvedValue(undefined);
      service.ledgerFilePath = 'ledger.journal';
      const rm = jest.spyOn(fs.promises, 'rm');
      await service.stop();
      expect(rm).toBeCalled();
    });

    it('should return immediately if ledger file path is not set', async () => {
      fs.promises.rm = mockFn().mockResolvedValue(undefined);
      const rm = jest.spyOn(fs.promises, 'rm');
      await service.stop();
      expect(rm).not.toBeCalled();
    });

    it('should stop the maintenance timer', async () => {
      const bisync = jest.spyOn(rcloneService, 'bisync');
      await service.start();
      await new Promise((resolve) => setTimeout(resolve, 1));
      await service.stop();
      await new Promise((resolve) => setTimeout(resolve, 1));
      expect(bisync).toBeCalledTimes(1);
    });
  });
});
