import fs from 'fs';
import loadConfig from './config.js';
import Config from './schema.js';
import yaml from 'js-yaml';

jest.mock('fs');

describe('loadConfig function', () => {
  it('should return default config when no config file is found', () => {
    fs.readFileSync = jest.fn().mockImplementation(() => {
      throw new Error('no such file or directory');
    });
    expect(loadConfig()).toEqual(Config.default());
  });

  it('should throw exception when config file exist but not invalid', () => {
    fs.readFileSync = jest.fn().mockReturnValue('invalid yaml');
    expect(loadConfig).toThrow();
  });

  it('should return correct yaml config', () => {
    const config = Object.assign(Config.default(), {
      log: {
        level: 'debug',
      },
      file: 'log.log',
    });
    fs.readFileSync = jest.fn().mockReturnValue(yaml.dump(config));
    expect(loadConfig()).toEqual(config);
  });
});
