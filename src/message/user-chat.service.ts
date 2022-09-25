import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import User from '../database/entities/User.entity.js';
import Chat from './entities/chat.entity.js';
import Message from './entities/message.entity.js';

@Injectable()
export default class UserChatService {
  private readonly userRepo: Repository<User>;
  private readonly chatRepo: Repository<Chat>;
  private readonly messageRepo: Repository<Message>;

  constructor(private readonly dataSource: DataSource) {
    this.userRepo = this.dataSource.getRepository(User);
    this.chatRepo = this.dataSource.getRepository(Chat);
    this.messageRepo = this.dataSource.getRepository(Message);
  }

  async getUserByTelegramChatID(chadId: string): Promise<User | null> {
    const chat = await this.chatRepo.findOne({
      where: {
        id: chadId,
      },
    });
    if (!chat) return null;
    return chat.user;
  }

  async getUser(username: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: {
        username: username,
      },
    });
  }

  async createUser(username: string): Promise<User> {
    const user = this.userRepo.create({
      username: username,
    });
    await this.userRepo.save(user);
    return user;
  }

  async bindTelegramChat(user: User, chatId: string) {
    const chat = this.chatRepo.create({
      id: chatId,
      user: user,
    });
    await this.chatRepo.save(chat);
    return chat;
  }

  async unbindTelegramChat(chatId: string) {
    await this.chatRepo.delete({
      id: chatId,
    });
  }

  async saveMessage(user: User, message: string) {
    const msg = this.messageRepo.create({
      content: message,
      receiver: user,
    });
    await this.messageRepo.save(msg);
    return msg;
  }

  async getAllChatsWithUser(user: User): Promise<Chat[]> {
    return await this.chatRepo.find({
      where: {
        user: {
          username: user.username,
        },
      },
    });
  }

  async getMessages(user: User): Promise<Message[]> {
    return await this.messageRepo.find({
      where: {
        receiver: {
          username: user.username,
        },
      },
    });
  }
}
