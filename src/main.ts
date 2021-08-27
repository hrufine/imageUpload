import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './transform.intercepter';
import { Logger } from '@nestjs/common'

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TransformInterceptor());
  const port = process.env.PORT;
  console.log(`**********PORT ${port}`);
  await app.listen(port);
  logger.log(`Application Listening on port ${port}`)
}
bootstrap();
