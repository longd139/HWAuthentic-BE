import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { AuthUser } from '../types/express';
import type { RegisterInput, LoginInput, ChangePasswordInput, ChangeRoleInput } from '../validators/auth.validator';

const SALT_ROUNDS = 12;

/**
 * Tạo JWT token từ thông tin user
 */
const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      roleCode: user.roleCode,
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN as any }
  );
};

/**
 * Đặt JWT vào HttpOnly cookie
 */
const setTokenCookie = (res: Response, token: string) => {
  res.cookie(ENV.ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });
};

/**
 * POST /api/auth/register
 * Đăng ký tài khoản nhân viên mới (Ẩn khỏi Swagger)
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, full_name, phone_number } =
      req.body as RegisterInput;

    // Kiểm tra username đã tồn tại
    const existingUsername = await prisma.staffUsers.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return sendError(res, 'Tên đăng nhập đã tồn tại', 409);
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await prisma.staffUsers.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return sendError(res, 'Email đã được sử dụng', 409);
    }

    // Tìm role STAFF, nếu chưa có thì tạo mới
    let staffRole = await prisma.roles.findUnique({
      where: { code: 'STAFF' },
    });

    if (!staffRole) {
      staffRole = await prisma.roles.create({
        data: {
          code: 'STAFF',
          name: 'Nhân viên',
          description: 'Nhân viên quản lý đơn hàng và sản phẩm',
        },
      });
    }

    // Đảm bảo role ADMIN tồn tại trong DB (cho adminMiddleware sau này)
    const adminRole = await prisma.roles.findUnique({
      where: { code: 'ADMIN' },
    });
    if (!adminRole) {
      await prisma.roles.create({
        data: {
          code: 'ADMIN',
          name: 'Quản trị viên',
          description: 'Quản trị viên hệ thống, có toàn quyền',
        },
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Tạo staff user
    const staff = await prisma.staffUsers.create({
      data: {
        username,
        email,
        password_hash: passwordHash,
        full_name,
        phone_number: phone_number || null,
        role_id: staffRole.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        phone_number: true,
        is_active: true,
        created_at: true,
        role: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    return sendSuccess(res, staff, 'Đăng ký tài khoản thành công', 201);
  } catch (error) {
    console.error('[Register Error]:', error);
    return sendError(res, 'Đăng ký thất bại, vui lòng thử lại sau', 500);
  }
};

/**
 * POST /api/auth/login
 * Đăng nhập
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as LoginInput;

    // Tìm user theo username
    const staff = await prisma.staffUsers.findUnique({
      where: { username },
      include: { role: { select: { code: true, name: true } } },
    });

    if (!staff) {
      return sendError(res, 'Tên đăng nhập hoặc mật khẩu không chính xác', 401);
    }

    if (!staff.is_active) {
      return sendError(res, 'Tài khoản đã bị vô hiệu hóa', 403);
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, staff.password_hash);
    if (!isMatch) {
      return sendError(res, 'Tên đăng nhập hoặc mật khẩu không chính xác', 401);
    }

    // Tạo JWT
    const authUser: AuthUser = {
      id: staff.id,
      username: staff.username,
      email: staff.email,
      roleId: staff.role_id,
      roleCode: staff.role.code,
    };

    const token = generateToken(authUser);

    // Set cookie
    setTokenCookie(res, token);

    // Trả về response
    return sendSuccess(res, {
      token,
      user: {
        id: staff.id,
        username: staff.username,
        email: staff.email,
        full_name: staff.full_name,
        phone_number: staff.phone_number,
        role: staff.role,
      },
    }, 'Đăng nhập thành công');
  } catch (error) {
    console.error('[Login Error]:', error);
    return sendError(res, 'Đăng nhập thất bại, vui lòng thử lại sau', 500);
  }
};

/**
 * POST /api/auth/logout
 * Đăng xuất
 */
export const logout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie(ENV.ADMIN_COOKIE_NAME, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return sendSuccess(res, null, 'Đăng xuất thành công');
  } catch (error) {
    console.error('[Logout Error]:', error);
    return sendError(res, 'Đăng xuất thất bại', 500);
  }
};

/**
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 */
export const me = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staffUsers.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        phone_number: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        role: {
          select: {
            code: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!staff) {
      return sendError(res, 'Không tìm thấy thông tin tài khoản', 404);
    }

    return sendSuccess(res, staff, 'Lấy thông tin tài khoản thành công');
  } catch (error) {
    console.error('[Me Error]:', error);
    return sendError(res, 'Không thể lấy thông tin tài khoản', 500);
  }
};

/**
 * POST /api/auth/refresh
 * Refresh token
 */
export const refresh = async (req: Request, res: Response) => {
  try {
    const currentUser = req.user!;

    // Tạo token mới
    const newToken = generateToken(currentUser);

    // Cập nhật cookie
    setTokenCookie(res, newToken);

    return sendSuccess(res, { token: newToken }, 'Token đã được làm mới thành công');
  } catch (error) {
    console.error('[Refresh Error]:', error);
    return sendError(res, 'Không thể làm mới token', 500);
  }
};

/**
 * PATCH /api/auth/users/:userId/role
 * Đổi role của user (Chỉ ADMIN mới dùng được)
 */
export const changeRole = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.userId);
    const { role_code } = req.body as ChangeRoleInput;

    if (isNaN(userId)) {
      return sendError(res, 'ID người dùng không hợp lệ', 400);
    }

    // Kiểm tra user tồn tại
    const staff = await prisma.staffUsers.findUnique({
      where: { id: userId },
    });

    if (!staff) {
      return sendError(res, 'Không tìm thấy người dùng', 404);
    }

    // Tìm role theo code
    const role = await prisma.roles.findUnique({
      where: { code: role_code },
    });

    if (!role) {
      return sendError(res, `Role '${role_code}' không tồn tại trong hệ thống`, 404);
    }

    // Cập nhật role
    const updated = await prisma.staffUsers.update({
      where: { id: userId },
      data: { role_id: role.id },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    return sendSuccess(res, updated, `Đã chuyển role của ${updated.username} thành ${updated.role.name} thành công`);
  } catch (error) {
    console.error('[ChangeRole Error]:', error);
    return sendError(res, 'Đổi role thất bại, vui lòng thử lại sau', 500);
  }
};
/**
 * POST /api/auth/change-password
 * Đổi mật khẩu
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { current_password, new_password } = req.body as ChangePasswordInput;
    const userId = req.user!.id;

    // Lấy thông tin user (cần password_hash)
    const staff = await prisma.staffUsers.findUnique({
      where: { id: userId },
    });

    if (!staff) {
      return sendError(res, 'Không tìm thấy tài khoản', 404);
    }

    // Verify mật khẩu hiện tại
    const isMatch = await bcrypt.compare(current_password, staff.password_hash);
    if (!isMatch) {
      return sendError(res, 'Mật khẩu hiện tại không chính xác', 400);
    }

    // Hash mật khẩu mới
    const newPasswordHash = await bcrypt.hash(new_password, SALT_ROUNDS);

    // Cập nhật
    await prisma.staffUsers.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    return sendSuccess(res, null, 'Đổi mật khẩu thành công');
  } catch (error) {
    console.error('[ChangePassword Error]:', error);
    return sendError(res, 'Đổi mật khẩu thất bại, vui lòng thử lại sau', 500);
  }
};