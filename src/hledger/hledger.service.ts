import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import winston from 'winston';
import LedgerFileService from './ledger-file.service.js';
import * as child_process from 'child_process';
import * as net from 'net';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';

@Injectable()
export default class HLedgerService {
  private _port: number | undefined;
  private _process: child_process.ChildProcess | undefined;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly configService: ConfigService<Config, true>,
    private readonly ledgerFileService: LedgerFileService,
  ) {
    this.logger = this.logger.child({ module: 'hledger' });
  }

  async start() {
    await this.startHLedgerRESTfulServer();
  }

  async stop() {
    await this.stopHLedgerRESTfulServer();
  }

  private async startHLedgerRESTfulServer(): Promise<void> {
    this._port = await this.configService.get('hledger.port', { infer: true });
    const domain = await this.configService.get('hledger.baseUrl', { infer: true });
    this._process = child_process.spawn('hledger-web', [
      '--serve',
      '--port',
      `${this._port}`,
      '--base-url',
      'https://hledger.troublor.xyz',
      '--cors',
      '*',
      '--file',
      this.ledgerFileService.ledgerFilePath as string,
    ]);
    this._process.on('exit', (code, signal) => {
      this.logger.info('hledger-web exited', { code, signal });
      if (signal !== 'SIGINT') {
        this.logger.info('Restarting hledger-web');
        this.startHLedgerRESTfulServer();
      } else {
        this._process = undefined;
      }
    });
    return new Promise<void>((resolve, reject) => {
      this._process?.on('error', (err) => {
        this.logger.error('Failed to start hledger', { cause: err });
        reject(err);
      });
      this._process?.on('spawn', () => {
        this.logger.info('hledger-web started on port ' + this._port);
        resolve();
      });
    });
  }

  private async stopHLedgerRESTfulServer(): Promise<void> {
    if (this._process) {
      this._process.kill('SIGINT');
      return new Promise<void>((resolve, reject) => {
        this._process?.on('exit', (code, signal) => {
          this.logger.info('hledger-web exited', { code, signal });
          resolve();
        });
        this._process?.on('error', (err) => {
          this.logger.error('Failed to stop hledger', { cause: err });
          reject(err);
        });
      });
    }
  }

  private async findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.unref();
      server.on('error', (err) =>
        reject(new Error('Could not find free port', { cause: err })),
      );

      server.listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr !== 'string') {
          server.close(() => {
            resolve(addr.port);
          });
        } else {
          reject(new Error('Failed to find free port'));
        }
      });
    });
  }
}
