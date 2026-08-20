import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import * as nodemailer from 'nodemailer';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('debug-email')
  async debugEmail() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS ? '***SET***' : 'MISSING';
    
    let sendResult = 'Did not attempt';
    let errorMessage = null;

    if (host && user) {
      try {
        const transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure: false,
          family: 4,
          auth: {
            user,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"CMMS App Alert" <no-reply@example.com>',
          to: 'nkdev26@gmail.com',
          subject: 'Diagnostic Test from Render',
          text: 'If you see this, the Render environment variables are working!',
        });
        sendResult = 'Success';
      } catch (e: any) {
        sendResult = 'Failed';
        errorMessage = e.message;
      }
    } else {
      sendResult = 'Failed before trying because host or user is missing in process.env';
    }

    return {
      timestamp: new Date().toISOString(),
      renderEnvironmentVariables: { host, port, user, pass },
      testSendToNKDev26: sendResult,
      exactError: errorMessage
    };
  }
}
