import app from './app';
import { ENV } from './config/env';
import { prisma } from './config/prisma';

const startServer = async () => {
  try {
    // Kiểm tra kết nối CSDL PostgreSQL qua Prisma
    await prisma.$connect();
    console.log('✅ Đã kết nối thành công tới Database PostgreSQL!');

    const server = app.listen(ENV.PORT, () => {
      console.log(`🚀 Backend Server đang chạy tại: http://localhost:${ENV.PORT}`);
      console.log(`📡 Health check API: http://localhost:${ENV.PORT}/api/health`);
    });

    // Graceful Shutdown
    const exitHandler = async () => {
      if (server) {
        server.close(async () => {
          console.log('🛑 Server đã đóng kết nối HTTP.');
          await prisma.$disconnect();
          console.log('🔌 Đã ngắt kết nối Database.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', exitHandler);
    process.on('SIGINT', exitHandler);
  } catch (error) {
    console.error('❌ Không thể khởi động Backend Server:', error);
    process.exit(1);
  }
};

startServer();
