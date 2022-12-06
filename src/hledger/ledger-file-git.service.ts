import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import winston from 'winston';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import path from 'path';
import * as os from 'os';
import simpleGit from 'simple-git';
import fs from 'fs';

@Injectable()
export default class LedgerFileGitService {
  private readonly accessToken: string;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly configService: ConfigService<Config, true>,
  ) {
    this.logger = this.logger.child({
      module: 'hledger',
      service: 'ledger-file-git',
    });
    this.accessToken = this.configService.get('github.accessToken', {
      infer: true,
    });
  }

  private readonly ledgersRepoPath: string = path.join(os.homedir(), 'ledgers');

  private _ledgerFilePath: string | undefined;
  get ledgerFilePath() {
    return this._ledgerFilePath;
  }

  async start() {
    // clone ledgers repo
    if (!fs.existsSync(this.ledgersRepoPath)) {
      const git = simpleGit();
      await git.clone(
        `https://${this.accessToken}@github.com/Troublor/ledgers.git`,
        this.ledgersRepoPath,
      );
    }
    this._ledgerFilePath = path.join(this.ledgersRepoPath, 'main.journal');
    fs.watchFile(this._ledgerFilePath, async (curr, prev) => {
      if (curr.mtime.getTime() > prev.mtime.getTime()) {
        const git = simpleGit(this.ledgersRepoPath);
        if (!this._ledgerFilePath) return;
        await git.add(this._ledgerFilePath);
        await git.commit('update ledger file from tgs');
        await git.push();
        this.logger.debug('ledger file updated and pushed');
      }
    });
  }

  async update() {
    // update ledgers repo
    const git = simpleGit(this.ledgersRepoPath);
    await git.pull();
  }

  async stop() {
    if (this._ledgerFilePath) {
      fs.unwatchFile(this._ledgerFilePath);
    }
    this._ledgerFilePath = undefined;
    // delete ledgers repo
    await fs.promises.rm(this.ledgersRepoPath, {
      recursive: true,
      force: true,
    });
  }
}
