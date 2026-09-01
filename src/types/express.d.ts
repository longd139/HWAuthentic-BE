import { Request } from 'express';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  roleId: number;
  roleCode: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}