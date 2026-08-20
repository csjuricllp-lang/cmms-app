import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import * as dns from 'dns';

// Force Node.js to use IPv4 first to prevent ENETUNREACH errors on Render/Railway
dns.setDefaultResultOrder('ipv4first');

import helmet from 'helmet';



async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  // CORS_ORIGINS is optional — the wildcard .vercel.app check in enableCors() covers all Vercel domains.

  const app = await NestFactory.create(AppModule);

  // Configure Express behind trusted reverse proxy
  const expressApp = app.getHttpAdapter().getInstance();
  if (expressApp && typeof expressApp.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  // Hardened Helmet HTTP Security Headers & CSP
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  app.use(cookieParser());

  // Enforce HTTPS in production
  if (isProduction) {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://cmms-app-4l4d.vercel.app',
      ];

  app.use((req, res, next) => {
    if (req.headers['access-control-request-private-network']) {
      res.header('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      // Allow localhost, the exact allowed origins, or ANY vercel preview domain
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const { IoAdapter } = require('@nestjs/platform-socket.io');
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
