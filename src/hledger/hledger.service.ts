import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import winston from 'winston';
import * as child_process from 'child_process';
import * as net from 'net';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import LedgerFileGitService from './ledger-file-git.service.js';

@Injectable()
export default class HLedgerService {
  private _port: number | undefined;
  private _process: child_process.ChildProcess | undefined;

  private _restartTimer: NodeJS.Timeout | undefined;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly configService: ConfigService<Config, true>,
    private readonly ledgerFileGitService: LedgerFileGitService,
  ) {
    this.logger = this.logger.child({ module: 'hledger' });
  }

  async start() {
    await this.startHLedgerRESTfulServer();
    const restartInterval = await this.configService.get(
      'hledger.restartInterval',
      { infer: true },
    );
    this._restartTimer = setInterval(async () => {
      // periodically restart hledger-web to avoid memory leak and deadlock
      await this.stopHLedgerRESTfulServer();
      await this.startHLedgerRESTfulServer();
    }, restartInterval);
  }

  async stop() {
    await this.stopHLedgerRESTfulServer();
    if (this._restartTimer) {
      clearInterval(this._restartTimer);
    }
  }

  private async startHLedgerRESTfulServer(): Promise<void> {
    this._port = await this.configService.get('hledger.port', { infer: true });
    const domain = await this.configService.get('hledger.baseUrl', {
      infer: true,
    });
    this._process = child_process.spawn('hledger-web', [
      '--serve',
      '--host',
      '0.0.0.0',
      '--port',
      `${this._port}`,
      '--base-url',
      domain,
      '--cors',
      '*',
      '--file',
      this.ledgerFileGitService.ledgerFilePath as string,
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
          this._process = undefined;
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
