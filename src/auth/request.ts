import { Request } from 'express';
import User from '../user/entities/User.entity.js';

export default interface RequestWithUser extends Request {
  user: User;
}
