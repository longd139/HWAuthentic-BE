import swaggerJSDoc from 'swagger-jsdoc';
import { ENV } from './env';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HWAuthentic E-Commerce API',
      version: '1.0.0',
      description:
        'Tài liệu API hệ thống E-Commerce hỗ trợ Guest Checkout, Quản trị viên (Admin), Nhân viên (Staff), Tracking 3 lớp và Webhook.',
      contact: {
        name: 'HWAuthentic Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT Token cho Admin/Staff',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: ENV.ADMIN_COOKIE_NAME,
          description: 'Session cookie lưu trữ JWT Token',
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
    './src/controllers/*.ts',
    './src/controllers/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
