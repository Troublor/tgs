import { Controller, Get, UseGuards } from '@nestjs/common';
import { Req } from '@nestjs/common';
import { CloudflareAccessPrivateGuard } from '../auth/cloudflare-access.guard';
import RequestWithUser from '../auth/request.js';

@Controller('/hledger')
export default class {
  @UseGuards(CloudflareAccessPrivateGuard)
  @Get('/')
  getHLedgerWeb(@Req() req: RequestWithUser) {
    const user = req.user;
  }
}
