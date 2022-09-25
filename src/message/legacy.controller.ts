import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import MessageService from './message.service.js';
import UserChatService from './user-chat.service.js';
import { PlainBody } from '../utils/plain-body.decorator.js';

@Controller()
export default class LegacyController {
  constructor(
    private readonly userService: UserChatService,
    private readonly messageService: MessageService,
  ) {}

  @Get('/telegram/notify/:userId/:message')
  @ApiBadRequestResponse({ description: 'Empty message to send' })
  @ApiNotFoundResponse({ description: 'No chat associated with userId' })
  async legacyNotify(
    @Param('message') msg: string,
    @Param('userId') username: string,
  ) {
    const user = await this.userService.getUser(username);
    if (!user) throw new NotFoundException('username not found');
    let count: number;
    try {
      count = await this.messageService.broadcastMessageToTelegram(user, msg);
    } catch (e) {
      throw new NotFoundException(e);
    }
    if (count > 0) {
      return `**NOTICE: this API is deprecated.
      Use "curl -X POST https://troublor.xyz/message/telegram/<username>[/<message>] -H ['Content-Type: text/plain' -d <message>]" instead.

      Message sent to user '${username}': \n${msg}`;
    } else {
      throw new NotFoundException('No chat associated with username');
    }
  }

  @Post('/telegram/notify/:userId')
  @ApiConsumes('text/plain')
  @ApiBadRequestResponse({ description: 'Empty message to send' })
  @ApiNotFoundResponse({ description: 'No chat associated with userId' })
  async legacyPostNotify(
    @PlainBody() raw: string,
    @Param('userId') username: string,
  ) {
    const text = raw.trim();
    if (text.length == 0) {
      throw new BadRequestException(new Error('empty message'));
    }
    const user = await this.userService.getUser(username);
    if (!user) throw new NotFoundException('username not found');
    let count: number;
    try {
      count = await this.messageService.broadcastMessageToTelegram(user, text);
    } catch (e) {
      throw new NotFoundException(e);
    }
    if (count > 0) {
      return `**NOTICE: this API is deprecated.
      Use "curl -X POST https://troublor.xyz/message/telegram/<username>[/<message>] -H ['Content-Type: text/plain' -d <message>]" instead.

      Message sent to user '${username}': \n${text}`;
    } else {
      throw new NotFoundException('No chat associated with username');
    }
  }
}
