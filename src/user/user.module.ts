import { Module } from '@nestjs/common';
import UserService from './user.service.js';
import User from './entities/User.entity.js';
import { WinstonModule } from 'nest-winston';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * This module provides identity service.
 */
@Module({
  imports: [
    WinstonModule.forRoot({
      level: 'info',
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [UserService],
})
export default class UserModule {}
