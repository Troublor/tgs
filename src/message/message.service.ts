import { Injectable } from '@nestjs/common';
import NotifierBotService from './notifier-bot.service.js';
import UserChatService from './user-chat.service.js';
import User from '../database/entities/User.entity.js';

@Injectable()
export default class MessageService {
  constructor(
    private readonly notifierBotService: NotifierBotService,
    private readonly userService: UserChatService,
  ) {}

  async broadcastMessageToTelegram(user: User, msg: string): Promise<number> {
    const message = await this.userService.saveMessage(user, msg);
    const destinations = await this.userService.getAllChatsWithUser(user);
    for (const dest of destinations) {
      await this.notifierBotService.sendMessage(dest.id, msg);
    }
    return destinations.length;
  }
}
