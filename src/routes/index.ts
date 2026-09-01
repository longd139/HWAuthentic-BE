import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';

const router = Router();

// Health Check API
router.get('/health', (_req: Request, res: Response) => {
  return sendSuccess(res, { status: 'healthy', timestamp: new Date().toISOString() }, 'Hệ thống hoạt động bình thường');
});

// Các sub-router sẽ được gắn kết tại đây trong các giai đoạn tiếp theo:
// router.use('/products', productRouter);
// router.use('/orders', orderRouter);
// router.use('/webhooks', webhookRouter);
// router.use('/admin', adminRouter);

export default router;
