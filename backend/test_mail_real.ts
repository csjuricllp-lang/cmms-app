import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MailService } from './src/mail/mail.service';

async function bootstrap() {
  console.log('Bootstrapping NestJS context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const mailService = app.get(MailService);

  const testEmail = process.argv[2] || 'test@example.com';
  console.log(`Triggering test work order notification to: ${testEmail}`);

  await mailService.sendWorkOrderNotification(
    testEmail,
    '🚨 Test Work Order Notification',
    'This is a test notification verifying that the CMMS email service is working with Nodemailer!',
    '/work-orders/test-id-123'
  );

  console.log('Test script completed successfully.');
  await app.close();
}

bootstrap().catch(err => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
