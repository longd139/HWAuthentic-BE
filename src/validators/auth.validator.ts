import { z } from 'zod';

/**
 * Schema đăng ký tài khoản nhân viên mới
 */
export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
      .max(50, 'Tên đăng nhập không được vượt quá 50 ký tự')
      .regex(
        /^[a-zA-Z0-9_]+$/,
        'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'
      ),
    email: z
      .string()
      .email('Email không hợp lệ'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    full_name: z
      .string()
      .min(1, 'Họ và tên không được để trống')
      .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
    phone_number: z
      .string()
      .max(20, 'Số điện thoại không được vượt quá 20 ký tự')
      .optional(),
  }),
});

/**
 * Schema đăng nhập
 */
export const loginSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(1, 'Tên đăng nhập không được để trống'),
    password: z
      .string()
      .min(1, 'Mật khẩu không được để trống'),
  }),
});

/**
 * Schema đổi mật khẩu
 */
export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z
      .string()
      .min(1, 'Mật khẩu hiện tại không được để trống'),
    new_password: z
      .string()
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  }),
});

/**
 * Schema đổi role (Chỉ Admin)
 */
export const changeRoleSchema = z.object({
  body: z.object({
    role_code: z
      .string()
      .min(1, 'Mã role không được để trống')
      .max(50, 'Mã role không hợp lệ'),
  }),
  params: z.object({
    userId: z.string().min(1, 'ID người dùng không hợp lệ'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>['body'];