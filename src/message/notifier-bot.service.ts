import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import winston from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import Config from '../config/schema.js';
import UserChatService from './user-chat.service.js';

@Injectable()
export default class NotifierBotService {
  private readonly bot: Telegraf | undefined;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private logger: winston.Logger,
    private readonly configService: ConfigService<Config, true>,
    private readonly userService: UserChatService,
  ) {
    this.logger = logger.child({ module: 'NotifierBot' });
    const botConfig = configService.get('telegramBot', { infer: true });
    if (!botConfig) {
      this.logger.warn('Telegram bot will not run since token is not set');
    } else {
      this.bot = new Telegraf(botConfig.token);
    }
  }

  public async launch() {
    if (!this.bot)
      throw new Error('bot not available. Probably bot token is not set.');
    this.bot.use(async (ctx, next) => {
      this.logger.debug('Got message from telegram', {
        msg: ctx.message,
        chat: ctx.message?.chat.id,
      });
      await next(); // runs next middleware
    });

    this.bot.command('status', async (ctx) => {
      if (!ctx.message) return;
      const chatId = ctx.message.chat.id;
      const user = await this.userService.getUserByTelegramChatID(
        chatId.toString(),
      );
      if (user) {
        ctx.reply(`Current chat is linked to username: ${user.username}`);
      } else {
        ctx.reply(
          'Current chat is not linked to any username. Use /link command to link to a username.',
        );
      }
    });

    this.bot.command('link', async (ctx) => {
      if (!ctx.message) return;
      const chatId = ctx.message.chat.id;
      const args = ctx.message.text.split(/\s/).filter((s) => s.length > 0);
      if (args.length < 2) {
        ctx.reply(
          'Invalid format. Please use the format: /link <username> [<password>]',
        );
        return;
      }
      const username = args[1];
      let user = await this.userService.getUser(username);
      if (!user) {
        user = await this.userService.createUser(username);
        ctx.reply(`Username does not exist.\nCreated new user '${username}'.`);
      }
      await this.userService.bindTelegramChat(user, chatId.toString());
      ctx.reply(`Linked current chat to username: ${username}`);
      this.logger.info(`Linked chat ${chatId} to username: ${username}`);
    });

    this.bot.command('unlink', async (ctx) => {
      if (!ctx.message) return;
      const chatId = ctx.message.chat.id;
      const user = await this.userService.getUserByTelegramChatID(
        chatId.toString(),
      );
      if (user) {
        await this.userService.unbindTelegramChat(chatId.toString());
        ctx.reply(`Unlinked current chat from username: ${user.username}`);
      } else {
        ctx.reply('Current chat is not linked to any username.');
      }
    });

    const serverDomain = 'https://api.troublor.xyz';
    this.bot.command('help', (ctx) => {
      const helpMessage = `Telegram Notification Service.
    Making it possible to programmably send telegram notifications programmatically.
Usage:
    /link current chat to a specific username. You can use any string.
    In your program running on servers, send HTTP request to the RESTful API below with the username.
    You will get notifications with the message sent from your program here!
Availability:
    The service is deployed on ${serverDomain}.
RESTful API:
    GET Method
      curl -X 'GET' ${serverDomain}/message/telegram/<username>/<message>
    POST Method
      curl -X 'POST' ${serverDomain}/message/telegram/<username> -H 'Content-Type: text/plain' -d '<message>'
Commands:
    /link <username> [<password>] - link current chat to a specific username.
                     The password is not needed if your user has not configured a password.
                     Then, you can use the RESTful API to send notification programmatically.
                     E.g., /link myId myPass
                           In any program, call the restful API, you will get notification here on Telegram.
    /status - show the username that current chat is linked to.
    /unlink - unlink current chat from username. You will not receive notification anymore.
    /help - show this usage.`;
      ctx.reply(helpMessage);
    });

    this.bot.on('text', (ctx) => {
      ctx.reply(
        `Hi ${ctx.message.from.first_name}, good to know you are here.\nPlease user command /help to check the usage.`,
      );
    });

    // launch bot
    await this.bot.launch();
  }

  async sendMessage(chatID: string, msg: string) {
    if (!this.bot) throw new Error('bot not available');
    try {
      const id = parseInt(chatID);
      await this.bot?.telegram.sendMessage(id, msg);
    } catch (e) {
      await this.bot?.telegram.sendMessage(chatID, msg);
    }
  }

  shutdown(signal?: string) {
    this.bot?.stop(signal);
  }
}
