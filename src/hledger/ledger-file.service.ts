import { Inject, Injectable } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import winston, { clear } from 'winston';
import RCloneService from '../netdrive/rclone.service.js';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import * as os from 'os';

@Injectable()
export default class LedgerFileService {
  public ledgerFilePath: string | undefined;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly configService: ConfigService<Config, true>,
    private readonly rcloneService: RCloneService,
  ) {
    this.logger = this.logger.child({
      module: 'hledger',
      service: 'ledger-file',
    });
  }

  async start() {
    await this.prepare();
  }

  async stop() {
    await this.unprepare();
  }

  async checkHealth(): Promise<boolean> {
    if (!this.ledgerFilePath) {
      return false;
    }
    return await fs.promises
      .access(this.ledgerFilePath, fs.constants.R_OK)
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Prepare the ledger file for hledger.
   */
  private maintenanceTimer: NodeJS.Timer | undefined;

  private async prepare(): Promise<string> {
    if (this.ledgerFilePath) {
      return this.ledgerFilePath;
    }

    const tmpDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'tgs-ledger-file-'),
    );
    const remotePath = this.configService.get(
      'hledger.netDriveLedgerFilePath',
      { infer: true },
    );
    const remoteDir = path.dirname(remotePath);
    const remoteFile = path.basename(remotePath);
    await this.rcloneService.touch(
      this.rcloneService.mkRemotePath(path.join(remoteDir, '.fish')),
    );
    await this.rcloneService.bisync(
      this.rcloneService.mkRemotePath(remoteDir),
      tmpDir,
      true,
    );
    this.ledgerFilePath = path.join(tmpDir, remoteFile);
    this.logger.info(`ledger file prepared at ${this.ledgerFilePath}`);
    this.maintenanceTimer = setInterval(this.maintenance.bind(this), 60 * 1000);
    return this.ledgerFilePath;
  }

  private async maintenance() {
    if (!this.ledgerFilePath) {
      return;
    }
    const remotePath = this.configService.get(
      'hledger.netDriveLedgerFilePath',
      { infer: true },
    );
    const remoteDir = path.dirname(remotePath);
    await this.rcloneService.bisync(
      this.rcloneService.mkRemotePath(remoteDir),
      path.dirname(this.ledgerFilePath),
      false,
    );
  }

  private async unprepare(): Promise<void> {
    if (this.maintenanceTimer) {
      clearInterval(this.maintenanceTimer);
      this.maintenanceTimer = undefined;
    }
    if (this.ledgerFilePath) {
      await fs.promises.rm(path.dirname(this.ledgerFilePath), {
        recursive: true,
      });
      this.ledgerFilePath = undefined;
      this.logger.info('ledger temp folder removed');
    }
  }
}
