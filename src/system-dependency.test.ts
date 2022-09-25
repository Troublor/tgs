import { commandExists } from './system-dependency.js';

describe('commandExists function', () => {
  it('should return true for linux basic commands', () => {
    expect(commandExists('ls')).toBe(true);
  });
  it('should return false for an non-exist command', () => {
    expect(commandExists('non-exist-command')).toBe(false);
  });
});
