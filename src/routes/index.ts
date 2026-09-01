import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import authRouter from './auth.routes';

const router = Router();

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Kiểm tra trạng thái hoạt động của Backend
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: Hệ thống hoạt động bình thường
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
 *                   example: Hệ thống hoạt động bình thường
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: healthy
 *                     timestamp:
 *                       type: string
 *                       example: 2026-09-01T13:45:00.000Z
 */
router.get('/health', (_req: Request, res: Response) => {
  return sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() }, 'Hệ thống hoạt động bình thường');
});

// Auth routes
router.use('/auth', authRouter);

// Các sub-router sẽ được gắn kết tại đây trong các giai đoạn tiếp theo:
// router.use('/products', productRouter);
// router.use('/orders', orderRouter);
// router.use('/webhooks', webhookRouter);
// router.use('/admin', adminRouter);

export default router;
