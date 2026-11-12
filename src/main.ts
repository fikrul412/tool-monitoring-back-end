import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              
      forbidNonWhitelisted: true,    
      transform: true, 
    })
  )
  await app.listen(process.env.PORT ?? 3000);
}

// Vercel's NestJS runtime expects the conventional non-blocking bootstrap.
// Log startup failures so they are visible in the function's runtime logs.
void bootstrap().catch((error: unknown) => {
  console.error('NestJS bootstrap failed:', error);
  throw error;
});
