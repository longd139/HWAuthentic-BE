import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';
import { sendError } from '../utils/response';
import { AuthUser } from '../types/express';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Lấy token từ Authorization header hoặc cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.[ENV.ADMIN_COOKIE_NAME]) {
      token = req.cookies[ENV.ADMIN_COOKIE_NAME];
    }

    if (!token) {
      return sendError(res, 'Vui lòng đăng nhập để tiếp tục', 401);
    }

    // 2. Verify token
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUser;

    // 3. Kiểm tra user còn tồn tại và active
    const staff = await prisma.staffUsers.findUnique({
      where: { id: decoded.id },
      include: { role: { select: { code: true } } },
    });

    if (!staff || !staff.is_active) {
      return sendError(res, 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa', 401);
    }

    // 4. Gán user vào request
    req.user = {
      id: staff.id,
      username: staff.username,
      email: staff.email,
      roleId: staff.role_id,
      roleCode: staff.role.code,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Token không hợp lệ', 401);
    }
    return sendError(res, 'Lỗi xác thực', 401);
  }
};