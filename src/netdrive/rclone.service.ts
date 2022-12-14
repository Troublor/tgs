import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import child_process from 'child_process';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as winston from 'winston';
import path from 'path';

@Injectable()
export default class RCloneService {
  private readonly rcloneConfigFilePath;
  private readonly rcloneRemote;
  private readonly mountMappings: Record<string, string> = {};

  constructor(
    private readonly configService: ConfigService<Config, true>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
  ) {
    this.rcloneRemote = this.configService.get('netDrive.rcloneRemote', {
      infer: true,
    });
    this.rcloneConfigFilePath = this.configService.get(
      'netDrive.rcloneConfigPath',
      {
        infer: true,
      },
    );
    this.logger = this.logger.child({ module: 'netdrive', service: 'rclone' });
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.touch(this.mkRemotePath('.fish'));
      return true;
    } catch (e) {
      this.logger.error('failed to touch remote');
      return false;
    }
  }

  mkRemotePath(...paths: string[]): string {
    return `${this.rcloneRemote}:${path.join(...paths)}`;
  }

  async mountFolder(remote: string, mountPoint: string): Promise<void> {
    const mountProcess = child_process.spawn(
      'rclone',
      [
        'mount',
        remote,
        mountPoint,
        '--daemon',
        '--vfs-cache-mode',
        'full',
        '--vfs-cache-poll-interval',
        '5s',
      ],
      {
        env: {
          ...process.env,
          RCLONE_CONFIG: this.rcloneConfigFilePath,
        },
      },
    );
    return new Promise((resolve, reject) => {
      mountProcess.on('exit', (code) => {
        switch (code) {
          case 0:
            this.logger.debug(`mounted ${remote} to ${mountPoint}`);
            this.mountMappings[mountPoint] = remote;
            resolve();
            break;
          default:
            this.logger.error(`failed to mount ${remote} to ${mountPoint}`);
            reject(new Error(`failed to mount with code ${code}`));
        }
      });
    });
  }

  async unmountFolder(mountPoint: string): Promise<void> {
    const unmountProcess = child_process.spawn('umount', [mountPoint]);
    return new Promise((resolve, reject) => {
      unmountProcess.on('exit', (code) => {
        switch (code) {
          case 0:
            this.logger.debug(
              `unmounted ${this.mountMappings[mountPoint]} from ${mountPoint}`,
            );
            delete this.mountMappings[mountPoint];
            resolve();
            break;
          default:
            this.logger.error(`failed to unmount ${mountPoint}`);
            reject(new Error(`failed to unmount with code ${code}`));
        }
      });
    });
  }

  async sync(source: string, destination: string): Promise<void> {
    const syncProcess = child_process.spawn(
      'rclone',
      ['sync', source, destination],
      {
        env: {
          ...process.env,
          RCLONE_CONFIG: this.rcloneConfigFilePath,
        },
      },
    );
    return new Promise((resolve, reject) => {
      syncProcess.on('exit', (code) => {
        switch (code) {
          case 0:
            this.logger.debug(`synced ${source} to ${destination}`);
            resolve();
            break;
          default:
            this.logger.error(`failed to sync ${source} to ${destination}`);
            reject(new Error(`failed to sync with code ${code}`));
        }
      });
    });
  }

  async touch(remote: string): Promise<void> {
    const touchProcess = child_process.spawn('rclone', ['touch', remote], {
      env: {
        ...process.env,
        RCLONE_CONFIG: this.rcloneConfigFilePath,
      },
    });
    return new Promise((resolve, reject) => {
      touchProcess.on('exit', (code) => {
        switch (code) {
          case 0:
            this.logger.debug(`touched ${remote}`);
            resolve();
            break;
          default:
            this.logger.error(`failed to touch ${remote}`);
            reject(new Error(`failed to touch with code ${code}`));
        }
      });
    });
  }

  async bisync(path1: string, path2: string, resync = false): Promise<void> {
    const args = ['bisync', path1, path2];
    if (resync) {
      args.push('--resync');
    } else {
      args.push('--force');
    }
    const bisyncProcess = child_process.spawn('rclone', args, {
      env: {
        ...process.env,
        RCLONE_CONFIG: this.rcloneConfigFilePath,
      },
    });
    return new Promise((resolve, reject) => {
      bisyncProcess.on('exit', (code) => {
        switch (code) {
          case 0:
            this.logger.debug(`bisynced ${path1} to ${path2}`);
            resolve();
            break;
          default:
            this.logger.error(`failed to bisync ${path1} to ${path2}`);
            reject(new Error(`failed to bisync with code ${code}`));
        }
      });
    });
  }
}
