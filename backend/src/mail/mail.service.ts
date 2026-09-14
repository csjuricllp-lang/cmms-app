import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
        family: 4, // Force IPv4 to bypass ENETUNREACH on Render's IPv6 network
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      } as any);
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

  async sendVendorMessage(email: string, vendorName: string, subject: string, message: string) {
    if (this.useRealEmail && this.transporter) {
      const from = this.configService.get<string>('SMTP_FROM') || '"CMMS App Alert" <no-reply@example.com>';
      try {
        await this.transporter.sendMail({
          from,
          to: email,
          subject: subject,
          text: message,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
              <h2 style="color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 10px; margin-top: 0;">Message regarding ${vendorName}</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #555; white-space: pre-wrap;">${message}</p>
              <br/><br/>
              <hr style="border: 0; border-top: 1px solid #eee;"/>
              <p style="font-size: 12px; color: #999; text-align: center;">This is an automated message sent from your CMMS platform.</p>
            </div>
          `,
        });
        this.logger.log(`Real email sent successfully to vendor ${email} (Subject: ${subject})`);
      } catch (error: any) {
        this.logger.error(`Failed to send real email to vendor ${email}: ${error.message}`);
        throw new Error(`Failed to send email: ${error.message}`);
      }
    } else {
      this.logger.log(`[MAIL MOCK] Sending Message to Vendor: ${email}`);
      this.logger.log(`[MAIL MOCK] Subject: ${subject}`);
      this.logger.log(`[MAIL MOCK] Content: ${message}`);
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
        throw new BadRequestException(`SMTP Error: ${error.message}`);
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
    
    // Format currency
    const formatCurrency = (val: any) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(val) || 0);

    const itemsRows = po.items && po.items.length > 0
      ? po.items.map((i: any) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 16px; color: #334155; font-size: 14px;">${i.part?.name || 'Item'}</td>
          <td style="padding: 12px 16px; color: #334155; font-size: 14px; text-align: center;">${i.quantity}</td>
          <td style="padding: 12px 16px; color: #334155; font-size: 14px; text-align: right;">${formatCurrency(i.unitCost)}</td>
          <td style="padding: 12px 16px; color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">${formatCurrency(Number(i.quantity) * Number(i.unitCost))}</td>
        </tr>`).join('')
      : '<tr><td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8;">No items listed</td></tr>';

    const subtotal = po.items ? po.items.reduce((sum: number, i: any) => sum + (Number(i.quantity) * Number(i.unitCost)), 0) : 0;
    const shipping = Number(po.shippingCost) || 0;
    const tax = Number(po.taxAmount) || 0;
    const grandTotal = Number(po.totalCost) || (subtotal + shipping + tax);

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f8fafc">
          <tr>
            <td align="center" style="padding: 40px 0;">
              
              <!-- Main Card -->
              <table width="640" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #F43F5E; padding: 32px 40px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="left">
                          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">PURCHASE ORDER</h1>
                          <p style="color: #ffe4e6; margin: 8px 0 0 0; font-size: 15px; font-weight: 500;">${orgName}</p>
                        </td>
                        <td align="right" valign="top">
                          <p style="color: #ffffff; margin: 0; font-size: 16px; font-weight: 600;"># ${po.number || 'N/A'}</p>
                          <p style="color: #fecdd3; margin: 4px 0 0 0; font-size: 14px;">${po.purchaseDate ? new Date(po.purchaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="color: #334155; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">Hello,</p>
                    <p style="color: #475569; font-size: 15px; line-height: 24px; margin: 0 0 32px 0;">Please find attached the official purchase order from <strong>${orgName}</strong>. Kindly confirm receipt and process the order at your earliest convenience.</p>

                    <!-- Data Table -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr>
                          <th style="background-color: #f1f5f9; padding: 12px 16px; text-align: left; color: #475569; font-size: 13px; font-weight: 600; text-transform: uppercase; tracking: 0.5px; border-bottom: 2px solid #e2e8f0;">Item / Description</th>
                          <th style="background-color: #f1f5f9; padding: 12px 16px; text-align: center; color: #475569; font-size: 13px; font-weight: 600; text-transform: uppercase; tracking: 0.5px; border-bottom: 2px solid #e2e8f0;">Qty</th>
                          <th style="background-color: #f1f5f9; padding: 12px 16px; text-align: right; color: #475569; font-size: 13px; font-weight: 600; text-transform: uppercase; tracking: 0.5px; border-bottom: 2px solid #e2e8f0;">Unit Price</th>
                          <th style="background-color: #f1f5f9; padding: 12px 16px; text-align: right; color: #475569; font-size: 13px; font-weight: 600; text-transform: uppercase; tracking: 0.5px; border-bottom: 2px solid #e2e8f0;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsRows}
                      </tbody>
                    </table>

                    <!-- Totals Box -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%"></td>
                        <td width="50%">
                          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
                            <tr>
                              <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Subtotal:</td>
                              <td align="right" style="color: #334155; font-size: 14px; font-weight: 500; padding-bottom: 8px;">${formatCurrency(subtotal)}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Shipping:</td>
                              <td align="right" style="color: #334155; font-size: 14px; font-weight: 500; padding-bottom: 8px;">${formatCurrency(shipping)}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; font-size: 14px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">Tax:</td>
                              <td align="right" style="color: #334155; font-size: 14px; font-weight: 500; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0;">${formatCurrency(tax)}</td>
                            </tr>
                            <tr>
                              <td style="color: #0f172a; font-size: 16px; font-weight: 700; padding-top: 16px;">Total Amount:</td>
                              <td align="right" style="color: #F43F5E; font-size: 18px; font-weight: 700; padding-top: 16px;">${formatCurrency(grandTotal)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f1f5f9; padding: 24px 40px; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated purchase order from ${orgName} generated via CMMS Engine.</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 4px 0 0 0;">Please do not reply to this email directly.</p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const content = `Please find our purchase order details below:
      PO Number: ${po.number || 'N/A'}
      Type: ${po.type || 'N/A'}
      Procuring Company: ${orgName}
      Total Amount: ${formatCurrency(grandTotal)}
    `;

    if (this.useRealEmail && this.transporter) {
      const from = this.configService.get<string>('SMTP_FROM') || '"CMMS App Alert" <no-reply@example.com>';
      try {
        await this.transporter.sendMail({
          from,
          to: vendorEmail,
          subject: title,
          text: content,
          html: htmlTemplate,
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
