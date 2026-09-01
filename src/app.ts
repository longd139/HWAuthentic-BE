import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import routes from './routes';
import { errorHandler } from './middlewares/errorHandler';

const app: Application = express();

// 1. Cấu hình CORS
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true, // Cho phép truyền HttpOnly Cookie qua lại giữa FE & BE
  })
);

// 2. Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(ENV.COOKIE_SECRET));

// 3. API Routes
app.use('/api', routes);

// 4. Global Error Handler Middleware
app.use(errorHandler);

export default app;
