import * as child_process from 'child_process';

const requireCommands: string[] = [
  'rclone',
  'pg_dump',
  'gzip',
  'umount',
  'hledger-web',
];

export default function checkDependencies() {
  for (const cmd of requireCommands) {
    if (!commandExists(cmd)) {
      throw new Error(`dependency command ${cmd} not found`);
    }
  }
}

export function commandExists(cmd: string): boolean {
  const result = child_process.spawnSync('sh', ['-c', `command -v ${cmd}`]);
  return result.status === 0;
}
