import { Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Config from '../config/schema.js';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import winston from 'winston';
import { WebhookGuardFactory } from '../github/webhook.guard.js';
import LedgerFileGitService from './ledger-file-git.service.js';

@Controller('/hledger')
export default class HLedgerController {
  private readonly webhookSecret: string;

  constructor(
    private readonly configService: ConfigService<Config, true>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly ledgerFileGitService: LedgerFileGitService,
  ) {
    this.logger = this.logger.child({
      module: 'HLedgerController',
    });
    this.webhookSecret = this.configService.get('hledger.webhookSecret', {
      infer: true,
    });
  }

  @Post('/update')
  @UseGuards(WebhookGuardFactory('hledger.webhookSecret'))
  async onPush() {
    this.logger.debug('Received webhook, updating ledgers');
    await this.ledgerFileGitService.update();
  }
}
