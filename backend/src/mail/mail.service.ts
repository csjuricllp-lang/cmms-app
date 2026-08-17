import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private useRealEmail = false;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && port && user && pass) {
      const secure = this.configService.get<boolean>('SMTP_SECURE') === true || String(this.configService.get('SMTP_SECURE')) === 'true';
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000,    // 5 seconds
        socketTimeout: 10000,     // 10 seconds
      });
      this.useRealEmail = true;
      this.logger.log(`MailService initialized with real SMTP transporter: ${host}:${port}`);
    } else {
      this.logger.warn('SMTP configuration is missing in environment variables. Falling back to log-based mock mail.');
    }
  }

  async sendWorkOrderNotification(
    email: string,
    title: string,
    content: string,
    urlSuffix: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const url = `${frontendUrl}${urlSuffix}`;

    if (this.useRealEmail && this.transporter) {
      const from = this.configService.get<string>('SMTP_FROM') || '"CMMS App Alert" <no-reply@example.com>';
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: title,
          text: `${content}\n\nLink to Work Order: ${url}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; margin-top: 0;">${title}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #555;">${content}</p>
              <br/>
              <div style="text-align: center;">
                <a href="${url}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                  View Work Order
                </a>
              </div>
              <br/><br/>
              <hr style="border: 0; border-top: 1px solid #eee;"/>
              <p style="font-size: 12px; color: #999; text-align: center;">This is an automated notification from your CMMS platform.</p>
            </div>
          `,
        });
        this.logger.log(`Real email sent successfully to ${email} (Subject: ${title})`);
      } catch (error) {
        this.logger.error(`Failed to send real email to ${email}: ${error.message}`);
      }
    } else {
      this.logger.log(`[MAIL MOCK] Sending Notification to ${email}`);
      this.logger.log(`[MAIL MOCK] Subject: ${title}`);
      this.logger.log(`[MAIL MOCK] Content: ${content}`);
      this.logger.log(`[MAIL MOCK] Link: ${url}`);
    }
  }

  async sendInvitationEmail(email: string, token: string, orgName: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/accept-invitation/${token}`;

    if (this.useRealEmail && this.transporter) {
      const from = this.configService.get<string>('SMTP_FROM') || '"CMMS App Alert" <no-reply@example.com>';
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: `Join ${orgName} on CMMS`,
          text: `You have been invited to join the organization "${orgName}" on our CMMS platform.\n\nAccept invitation here: ${inviteUrl}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 10px; margin-top: 0;">Invitation to join ${orgName}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #555;">You have been invited to join the organization <strong>${orgName}</strong> on our CMMS platform.</p>
              <br/>
              <div style="text-align: center;">
                <a href="${inviteUrl}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                  Accept Invitation
                </a>
              </div>
              <br/><br/>
              <hr style="border: 0; border-top: 1px solid #eee;"/>
              <p style="font-size: 12px; color: #999; text-align: center;">If you did not expect this invitation, please ignore this email.</p>
            </div>
          `,
        });
        this.logger.log(`Real invitation email sent successfully to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send real invitation email to ${email}: ${error.message}`);
        throw new import('@nestjs/common').BadRequestException(\`SMTP Error: \${error.message}\`);
      }
    } else {
      this.logger.log(`[MAIL MOCK] Sending invitation to ${email}`);
      this.logger.log(`[MAIL MOCK] Organization: ${orgName}`);
      this.logger.log(`[MAIL MOCK] Link: ${inviteUrl}`);
    }
  }

  async sendInventoryAlert(
    email: string,
    title: string,
    content: string,
    urlSuffix: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const url = `${frontendUrl}${urlSuffix}`;

    if (this.useRealEmail && this.transporter) {
      const from = this.configService.get<string>('SMTP_FROM') || '"CMMS App Alert" <no-reply@example.com>';
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: title,
          text: `${content}\n\nLink to Inventory: ${url}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #f57c00; border-bottom: 2px solid #f57c00; padding-bottom: 10px; margin-top: 0;">${title}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #555;">${content}</p>
              <br/>
              <div style="text-align: center;">
                <a href="${url}" style="background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                  View Inventory Item
                </a>
              </div>
              <br/><br/>
              <hr style="border: 0; border-top: 1px solid #eee;"/>
              <p style="font-size: 12px; color: #999; text-align: center;">This is an automated notification from your CMMS platform.</p>
            </div>
          `,
        });
        this.logger.log(`Real inventory alert email sent successfully to ${email} (Subject: ${title})`);
      } catch (error) {
        this.logger.error(`Failed to send real inventory email to ${email}: ${error.message}`);
      }
    } else {
      this.logger.log(`[MAIL MOCK] Sending Inventory Alert to ${email}`);
      this.logger.log(`[MAIL MOCK] Subject: ${title}`);
      this.logger.log(`[MAIL MOCK] Content: ${content}`);
      this.logger.log(`[MAIL MOCK] Link: ${url}`);
    }
  }

  async sendPurchaseOrderEmail(
    vendorEmail: string,
    po: any,
    orgName: string,
  ) {
    const title = `Purchase Order from ${orgName} - ${po.number || 'New Order'}`;
    const itemsHtml = po.items && po.items.length > 0
      ? po.items.map((i: any) => `<li>${i.quantity}x ${i.part?.name || 'Part'} (₹${i.unitCost})</li>`).join('')
      : '<li>No specific items listed</li>';

    const content = `Please find our purchase order details below:
      PO Number: ${po.number || 'N/A'}
      Type: ${po.type || 'N/A'}
      Procuring Company: ${orgName}
      Total Items: ${po.items ? po.items.length : 0}
    `;

    if (this.useRealEmail && this.transporter) {
      const from = this.configService.get<string>('SMTP_FROM') || '"CMMS App Alert" <no-reply@example.com>';
      try {
        await this.transporter.sendMail({
          from,
          to: vendorEmail,
          subject: title,
          text: content,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-top: 0;">${title}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #555;">Hello,</p>
              <p style="font-size: 16px; line-height: 1.5; color: #555;">Please find the details for our recent purchase order:</p>
              <ul>
                <li><strong>PO Number:</strong> ${po.number || 'N/A'}</li>
                <li><strong>Purchase Date:</strong> ${po.purchaseDate ? new Date(po.purchaseDate).toLocaleDateString() : 'N/A'}</li>
                <li><strong>Procuring Company:</strong> ${orgName}</li>
              </ul>
              <h3 style="color: #4f46e5;">Items Ordered</h3>
              <ul style="line-height: 1.5; color: #555;">
                ${itemsHtml}
              </ul>
              <br/><br/>
              <hr style="border: 0; border-top: 1px solid #eee;"/>
              <p style="font-size: 12px; color: #999; text-align: center;">This is an automated purchase order from ${orgName} via CMMS Engine.</p>
            </div>
          `,
        });
        this.logger.log(`Real PO email sent successfully to ${vendorEmail} (Subject: ${title})`);
      } catch (error) {
        this.logger.error(`Failed to send real PO email to ${vendorEmail}: ${error.message}`);
      }
    } else {
      this.logger.log(`[MAIL MOCK] Sending PO to Vendor ${vendorEmail}`);
      this.logger.log(`[MAIL MOCK] Subject: ${title}`);
      this.logger.log(`[MAIL MOCK] Content: ${content}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${token}`;

    if (this.useRealEmail && this.transporter) {
      const from = this.configService.get<string>('SMTP_FROM') || '"CMMS App Alert" <no-reply@example.com>';
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: 'Password Reset Request',
          text: `You requested a password reset. Click here to reset it: ${resetUrl}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-top: 0;">Password Reset Request</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #555;">You recently requested to reset your password for your CMMS account.</p>
              <br/>
              <div style="text-align: center;">
                <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <br/><br/>
              <p style="font-size: 14px; color: #555;">If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
              <hr style="border: 0; border-top: 1px solid #eee;"/>
              <p style="font-size: 12px; color: #999; text-align: center;">This link will expire in 1 hour.</p>
            </div>
          `,
        });
        this.logger.log(`Real password reset email sent successfully to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send real password reset email to ${email}: ${error.message}`);
      }
    } else {
      this.logger.log(`[MAIL MOCK] Sending Password Reset to ${email}`);
      this.logger.log(`[MAIL MOCK] Link: ${resetUrl}`);
    }
  }
}
