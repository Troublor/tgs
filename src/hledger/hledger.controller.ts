import { Controller, Get, UseGuards } from '@nestjs/common';
import { Req } from '@nestjs/common';
import { CloudflareAccessGuard } from '../auth/cloudflare-access.guard.js';
import RequestWithUser from '../auth/request.js';
import PrivateGuard from '../auth/private.guard.js';

@Controller('/hledger')
export default class HLedgerController {
  @UseGuards(CloudflareAccessGuard, PrivateGuard)
  @Get('/')
  getHLedgerWeb(@Req() req: RequestWithUser) {
    const user = req.user;
  }
}
