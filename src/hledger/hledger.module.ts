import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import HLedgerController from './hledger.controller.js';
import LedgerFileService from './ledger-file.service.js';
import winston from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import NetDriveModule from '../netdrive/netdrive.module.js';
import HLedgerService from './hledger.service.js';

@Module({
  imports: [NetDriveModule],
  controllers: [HLedgerController],
  providers: [LedgerFileService, HLedgerService],
})
export default class HLedgerModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly ledgerFileService: LedgerFileService,
    private readonly hledgerService: HLedgerService,
  ) {
    this.logger = this.logger.child({ module: 'hledger' });
  }

  async onModuleInit() {
    await this.ledgerFileService.start();
    if (!(await this.ledgerFileService.checkHealth())) {
      this.logger.error('Ledger file is not healthy');
      process.exit(-1);
    }
    this.logger.info('Ledger file is healthy');

    await this.hledgerService.start();
    this.logger.info('HLedger service started');
  }

  async onModuleDestroy() {
    this.logger.info('Stopping hledger service');
    await this.hledgerService.stop();

    this.logger.info('Stopping ledger file service');
    await this.ledgerFileService.stop();
  }
}
