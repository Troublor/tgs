import loadConfig from './config.js';
import Config from './schema.js';
import yaml from 'js-yaml';
import { jest } from '@jest/globals';
import { mockFn } from 'jest-mock-extended';
import fs from 'fs';

describe('loadConfig function', () => {
  beforeAll(() => jest.mock('fs'));
  afterAll(() => jest.clearAllMocks());
  it('should return default config when no config file is found', () => {
    fs.readFileSync = mockFn().mockImplementation(() => {
      throw new Error('file not found');
    });
    expect(loadConfig()).toEqual(Config.default());
  });

  it('should throw exception when config file exist but not invalid', () => {
    const readFileSync = mockFn<typeof fs.readFileSync>();
    readFileSync.mockReturnValue('invalid yaml');
    fs.readFileSync = readFileSync;
    expect(loadConfig).toThrow();
  });

  it('should return correct yaml config', () => {
    const config = Object.assign(Config.default(), <Config>{
      log: {
        level: 'debug',
        file: 'log.log',
      },
      telegramBot: {
        disable: true,
        token: '',
      },
    });
    fs.readFileSync = mockFn().mockReturnValue(yaml.dump(config));
    const loadedConfig = loadConfig();
    expect(loadedConfig).toEqual(config);
  });
});
