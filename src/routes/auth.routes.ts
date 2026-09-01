import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validateRequest";
import { authMiddleware } from "../middlewares/auth";
import { adminMiddleware } from "../middlewares/admin";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  changeRoleSchema,
} from "../validators/auth.validator";

const router = Router();

/**
 * POST /api/auth/register
 * Đăng ký tài khoản nhân viên mới
 * (Endpoint này không có @openapi tag -> tự động ẩn khỏi Swagger)
 */
router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register,
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập vào hệ thống
 *     description: |
 *       Xác thực thông tin đăng nhập (username + password).
 *       - Trả về JWT Token trong response body
 *       - Tự động set HttpOnly Cookie `hw_staff_session` để duy trì phiên đăng nhập
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Tên đăng nhập
 *                 example: admin
 *               password:
 *                 type: string
 *                 description: Mật khẩu
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng nhập thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT Token
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         phone_number:
 *                           type: string
 *                           nullable: true
 *                         role:
 *                           type: object
 *                           properties:
 *                             code:
 *                               type: string
 *                             name:
 *                               type: string
 *       401:
 *         description: Sai tên đăng nhập hoặc mật khẩu
 *       403:
 *         description: Tài khoản đã bị vô hiệu hóa
 *     security:
 *       - cookieAuth: []
 */
router.post("/login", validateRequest(loginSchema), authController.login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     description: Xóa HttpOnly Cookie `hw_staff_session` để kết thúc phiên đăng nhập
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đăng xuất thành công
 *                 data:
 *                   type: null
 *     security:
 *       - cookieAuth: []
 */
router.post("/logout", authController.logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản hiện tại
 *     description: Trả về thông tin chi tiết của user đang đăng nhập (bao gồm role)
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     phone_number:
 *                       type: string
 *                       nullable: true
 *                     is_active:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     role:
 *                       type: object
 *                       properties:
 *                         code:
 *                           type: string
 *                         name:
 *                           type: string
 *                         description:
 *                           type: string
 *       401:
 *         description: Chưa đăng nhập hoặc token hết hạn
 *       404:
 *         description: Không tìm thấy tài khoản
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 */
router.get("/me", authMiddleware, authController.me);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Làm mới JWT Token
 *     description: |
 *       Tạo mới JWT Token từ token hiện tại còn hiệu lực.
 *       - Token mới được set lại vào HttpOnly Cookie
 *       - Trả về token mới trong response body
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Làm mới token thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token đã được làm mới thành công
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *       401:
 *         description: Token không hợp lệ hoặc đã hết hạn
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 */
router.post("/refresh", authMiddleware, authController.refresh);

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     description: Xác thực mật khẩu hiện tại và cập nhật mật khẩu mới
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Mật khẩu hiện tại
 *                 example: 123456
 *               new_password:
 *                 type: string
 *                 description: Mật khẩu mới (ít nhất 6 ký tự)
 *                 example: 654321
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Đổi mật khẩu thành công
 *                 data:
 *                   type: null
 *       400:
 *         description: Mật khẩu hiện tại không chính xác
 *       401:
 *         description: Chưa đăng nhập
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 */
router.post(
  "/change-password",
  authMiddleware,
  validateRequest(changePasswordSchema),
  authController.changePassword,
);

/**
 * ============================================================
 *  🛡️ API CHUYỂN ROLE — Dành riêng cho ADMIN
 *  ============================================================
 *  ⚠️ TẠM THỜI: Bỏ comment authMiddleware + adminMiddleware
 *     để dùng không cần đăng nhập (test nhanh).
 *  ✅ SAU NÀY: Bật lại authMiddleware + adminMiddleware
 *  Body: { "role_code": "ADMIN" }
 *  ============================================================
 */
router.patch(
  "/users/:userId/role",
  authMiddleware, // TODO: Bật lại khi hệ thống ổn định
  adminMiddleware, // TODO: Bật lại khi hệ thống ổn định
  validateRequest(changeRoleSchema),
  authController.changeRole,
);

export default router;
