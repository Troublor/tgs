import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import winston from 'winston';
import * as child_process from 'child_process';
import { baseDataSourceConfig } from './data-source.base.js';
import path from 'path';
import fs from 'fs';
import RCloneService from '../netdrive/rclone.service.js';
import Config from '../config/schema.js';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { PostgresConnectionCredentialsOptions } from 'typeorm/driver/postgres/PostgresConnectionCredentialsOptions.js';

@Injectable()
export default class BackupService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly configService: ConfigService<Config, true>,
    private readonly dataSource: DataSource,
    private readonly rcloneService: RCloneService,
  ) {
    this.logger = this.logger.child({ module: 'database', service: 'backup' });
  }

  private active = false;

  start() {
    this.active = true;
    this.loop();
  }

  stop() {
    this.active = false;
  }

  /**
   * Start a periodic backup of the database.
   */
  private loop() {
    this.active &&
      this.backup().then(() => {
        this.active &&
          setTimeout(
            () => this.loop(),
            this.configService.get('database.backupInterval', { infer: true }),
          );
      });
  }

  private async backup(): Promise<void> {
    this.logger.info('Starting backup');
    const tmpDir = await fs.promises.mkdtemp('tgs-database-backup-');
    try {
      const dumpPath = path.join(tmpDir, 'dump.tar');
      this.logger.info(
        `starting backup database ${baseDataSourceConfig.database}`,
      );

      if (!this.active) {
        this.logger.info('backup aborted');
        return;
      }

      // dump database
      const dataSourceOpts = this.dataSource
        .options as PostgresConnectionOptions;
      const dumpProcess = child_process.spawn(
        'sh',
        [
          '-c',
          `pg_dump ${dataSourceOpts.database} --host=${dataSourceOpts.host} --port=${dataSourceOpts.port} --username=${dataSourceOpts.username} -f ${dumpPath} --format=t`,
        ],
        {
          env: {
            PGPASSWORD: dataSourceOpts.password as string,
          },
        },
      );
      await new Promise<void>((resolve, reject) => {
        dumpProcess.on('exit', (code) => {
          switch (code) {
            case 0:
              this.logger.info(`dumped database to ${dumpPath}`);
              resolve();
              break;
            default:
              this.logger.error(`failed to dump database to ${dumpPath}`);
              reject(new Error(`failed to dump database with code ${code}`));
          }
        });
      });
      this.logger.info(`dumped database to ${dumpPath}`);

      if (!this.active) {
        this.logger.info('backup aborted');
        return;
      }

      // save dump to remote
      const mode = this.configService.get('mode', { infer: true });
      const remotePath = this.rcloneService.mkRemotePath(
        this.configService.get('database.netDriveBackupFolder', {
          infer: true,
        }),
        `${baseDataSourceConfig.database}-${mode}.tar`,
      );
      await this.rcloneService.sync(dumpPath, remotePath);
      this.logger.info(`saved database dump to remote ${remotePath}`);
    } finally {
      // cleanup
      await fs.promises.rm(tmpDir, { recursive: true });
    }
  }
}
