import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

/**
 * Admin Middleware — Chỉ cho phép user có role ADMIN truy cập
 * Phải được sử dụng SAU authMiddleware (req.user đã được gán)
 */
export const adminMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return sendError(res, 'Vui lòng đăng nhập để tiếp tục', 401);
  }

  if (req.user.roleCode !== 'ADMIN') {
    return sendError(res, 'Bạn không có quyền truy cập. Chỉ Admin mới được phép.', 403);
  }

  next();
};