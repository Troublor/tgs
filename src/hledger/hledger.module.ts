import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import HLedgerController from './hledger.controller.js';
import LedgerFileService from './ledger-file.service.js';
import winston from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import NetDriveModule from '../netdrive/netdrive.module.js';
import HLedgerService from './hledger.service.js';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import LedgerFileGitService from './ledger-file-git.service.js';

@Module({
  imports: [NetDriveModule],
  controllers: [HLedgerController],
  providers: [LedgerFileService, HLedgerService, LedgerFileGitService],
})
export default class HLedgerModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly configService: ConfigService<Config, true>,
    private readonly ledgerFileGitService: LedgerFileGitService,
    private readonly hledgerService: HLedgerService,
  ) {
    this.logger = this.logger.child({ module: 'hledger' });
  }

  async onModuleInit() {
    if (this.configService.get('hledger.disable', { infer: true })) {
      this.logger.info('hledger is disabled');
      return;
    }
    await this.ledgerFileGitService.start();
    this.logger.info('Ledger file is healthy');

    await this.hledgerService.start();
    this.logger.info('HLedger service started');
  }

  async onModuleDestroy() {
    if (this.configService.get('hledger.disable', { infer: true })) {
      return;
    }
    this.logger.info('Stopping hledger service');
    await this.hledgerService.stop();

    this.logger.info('Stopping ledger file service');
    await this.ledgerFileGitService.stop();
  }
}
