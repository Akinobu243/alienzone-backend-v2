import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { json } from 'express';

import { readFileSync } from 'fs';
import { AppModule } from './modules/app/app.module';
import { API_PREFIX } from './shared/constants/global.constants';
import { SwaggerConfig } from './configs/config.interface';
import { GLOBAL_CONFIG } from './configs/global.config';
import { MyLogger } from './modules/logger/logger.service';
import { InvalidFormExceptionFilter } from './filters/invalid.form.exception.filter';
import { AllExceptionsFilter } from './filters/all.exceptions.filter';

async function bootstrap() {
  const useSSL =
    process.env.SSL_KEY_PATH &&
    process.env.SSL_CERT_PATH &&
    process.env.HTTPS_PORT;
  let httpsOptions = null;
  if (useSSL) {
    httpsOptions = {
      key: readFileSync(process.env.SSL_KEY_PATH),
      cert: readFileSync(process.env.SSL_CERT_PATH),
    };
  }
  const app = await NestFactory.create(AppModule, {
    httpsOptions: httpsOptions,
    logger: ['error', 'error', 'warn'],
  });

  app.setGlobalPrefix(API_PREFIX);

  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost)),
    new InvalidFormExceptionFilter(),
  );

  // app.use(
  //   cors({
  //     origin: [process.env.FRONTEND_URL, process.env.FRONTEND_DEV_URL, '*'],
  //     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  //     credentials: true,
  //   }),
  // );

  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          process.env.FRONTEND_URL,
          process.env.FRONTEND_DEV_URL,
          'https://nalikes-alienzone-frontend-v2.vercel.app',
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          console.log(`Blocked by CORS: ${origin}`);
          callback(null, true); // Temporarily allow all origins while debugging
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    }),
  );

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe());

  // Use raw body for Stripe webhook
  app.use(
    '/api/v1/stripe/webhook',
    json({
      verify: (req: any, res, buf) => {
        if (req.originalUrl.startsWith('/api/v1/stripe/webhook')) {
          req.rawBody = buf;
        }
      },
    }),
  );

  // Regular JSON parsing for other routes
  app.use(json());

  const configService = app.get<ConfigService>(ConfigService);
  const swaggerConfig = configService.get<SwaggerConfig>('swagger');

  // Swagger Api
  if (swaggerConfig.enabled) {
    const options = new DocumentBuilder()
      .setTitle(swaggerConfig.title || 'Nestjs')
      .setDescription(swaggerConfig.description || 'The nestjs API description')
      .setVersion(swaggerConfig.version || '1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);

    SwaggerModule.setup(swaggerConfig.path || 'api', app, document);
  }

  const PORT =
    (useSSL ? process.env.HTTPS_PORT : null) ||
    process.env.PORT ||
    GLOBAL_CONFIG.nest.port;
  await app.listen(PORT, '0.0.0.0', async () => {
    const myLogger = await app.resolve(MyLogger);
    myLogger.log(`Server started listening: ${PORT}`);
  });
}
bootstrap();
