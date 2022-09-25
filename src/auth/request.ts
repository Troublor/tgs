import { Request } from 'express';
import User from '../database/entities/User.entity.js';

export default interface RequestWithUser extends Request {
  user: User;
}
