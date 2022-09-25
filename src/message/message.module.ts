import { Inject, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import DatabaseModule from '../database/database.module.js';
import MessageService from './message.service.js';
import MessageController from './message.controller.js';
import LegacyController from './legacy.controller.js';
import NotifierBotService from './notifier-bot.service.js';
import UserChatService from './user-chat.service.js';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import winston from 'winston';
import { TypeOrmModule } from '@nestjs/typeorm';
import Chat from './entities/chat.entity.js';
import Message from './entities/message.entity.js';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Chat, Message])],
  providers: [MessageService, UserChatService, NotifierBotService],
  controllers: [MessageController, LegacyController],
  exports: [MessageService],
})
export default class MessageModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: winston.Logger,
    private readonly notifierBotService: NotifierBotService,
  ) {
    this.logger = logger.child({ module: 'message' });
  }

  async onModuleInit() {
    // start telegram bot
    try {
      await this.notifierBotService.launch();
      this.logger.info('Telegram bot launched');
    } catch (e) {
      this.logger.error('Failed to launch telegram bot', { err: e });
    }
  }

  async onModuleDestroy() {
    await this.notifierBotService.shutdown();
  }
}
