import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import MessageService from './message.service.js';
import UserChatService from './user-chat.service.js';
import { PlainBody } from '../utils/plain-body.decorator.js';
import { CloudflareAccessGuard } from '../auth/cloudflare-access.guard.js';
import RequestWithUser from '../auth/request.js';

@Controller('/message')
export default class MessageController {
  constructor(
    private readonly userService: UserChatService,
    private readonly messageService: MessageService,
  ) {}

  @Post('/telegram/:username/:message?')
  @ApiConsumes('text/plain')
  @ApiBadRequestResponse({ description: 'Empty message to send' })
  @ApiNotFoundResponse({ description: 'No chat associated with username' })
  async sendMessage(
    @PlainBody() raw: string,
    @Param('username') username: string,
    @Param('message') msg?: string,
  ) {
    let text = '';
    if (msg) text += msg + '\n';
    text += raw;
    text = text.trim();
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
      return `Message sent to user '${username}': \n${text}`;
    } else {
      throw new NotFoundException('No chat associated with username');
    }
  }

  @Get('/history')
  @UseGuards(CloudflareAccessGuard)
  async getMessage(
    @Req() req: RequestWithUser,
  ): Promise<Record<string, unknown>[]> {
    const user = req.user;
    const history = await this.userService.getMessages(user);
    return history.map((m) => m.jsonObject);
  }
}
