import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from 'redis';
import sgMail from '@sendgrid/mail';

const SENDGRID_SEND_TIMEOUT_MS = 10_000;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('REDIS_CLIENT') private readonly redis: RedisClientType,
  ) {
    const apiKey = configService.get<string>('SENDGRID_API_KEY', '');
    this.from = configService.get<string>(
      'SENDGRID_FROM',
      'CRM-KOC System <no-reply@crm-koc.asia>',
    );
    sgMail.setTimeout(SENDGRID_SEND_TIMEOUT_MS);
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      this.logger.warn('SENDGRID_API_KEY is missing. Emails will not be sent.');
    }
  }

  private async isSystemEmailActive(): Promise<boolean> {
    try {
      const data = await this.redis.get('environment_toggles');
      if (data) {
        const toggles = JSON.parse(data) as {
          ENV_SYSTEM_EMAILS_ACTIVE?: boolean;
        };
        if (toggles.ENV_SYSTEM_EMAILS_ACTIVE === false) {
          return false;
        }
      }
    } catch (e) {
      this.logger.error(
        'Failed to parse environment_toggles in EmailService',
        e,
      );
    }
    return true;
  }

  private getBaseHtml(content: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family:Arial,Helvetica,sans-serif; }
    .container { width:100%; padding:40px 0; background:#f4f6f8; }
    .content-table { margin: 0 auto; width:560px; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08); border-collapse: collapse; }
    .header { background:#1a56db; padding:24px 40px; text-align:center; }
    .header-text { color:#fff; font-size:20px; font-weight:700; }
    .body-cell { padding:36px 40px; }
    .footer { background:#f9fafb; border-top:1px solid #e5e7eb; padding:16px 40px; text-align:center; }
    .footer-text { margin:0; font-size:12px; color:#9ca3af; line-height: 1.5; }
    .link-btn { color: #1a56db; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <table class="content-table">
      <tr>
        <td class="header">
          <span class="header-text">CRM-KOC System</span>
        </td>
      </tr>
      <tr>
        <td class="body-cell">
          ${content}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="footer-text">
            &copy; 2026 CRM-KOC. All rights reserved.<br/>
            This is an automated message from the CRM-KOC system. Please do not reply directly to this email.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
  }

  async sendProposalEmail(opts: {
    from?: string; // Opts.from is ignored to force system default
    to: string;
    subject: string;
    message: string;
    attachmentUrl?: string;
    proposalRequestId: string;
  }): Promise<void> {
    if (!(await this.isSystemEmailActive())) {
      this.logger.warn(
        `Email Service Toggled Off. Dropping proposal email to ${opts.to}.`,
      );
      return;
    }

    const msgBody = opts.message.replace(/\n/g, '<br>');
    const attachmentSection = opts.attachmentUrl
      ? `<p style="margin:16px 0 0;"><a href="${opts.attachmentUrl}" class="link-btn">📎 View Attachment</a></p>`
      : '';

    const content = `
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">${msgBody}</p>
      ${attachmentSection}
    `;

    await sgMail.send({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.message,
      html: this.getBaseHtml(content),
      trackingSettings: { openTracking: { enable: true } },
      customArgs: { proposalRequestId: opts.proposalRequestId },
    });
  }

  // Không có toggle isSystemEmailActive() ở đây: OTP đăng nhập luôn phải gửi.
  async sendOtpEmail(
    to: string,
    otp: string,
    displayName: string,
  ): Promise<void> {
    const content = `
      <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hello <strong>${displayName}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        You are attempting to log in to the CRM-KOC platform.
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
        Your One-Time Password (OTP) for verification is:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <div style="display:inline-block;background:#f0f4ff;border:2px dashed #1a56db;border-radius:8px;padding:18px 48px;">
              <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#1a56db;font-family:'Courier New',Courier,monospace;">${otp}</span>
            </div>
          </td>
        </tr>
      </table>
      <p style="margin:28px 0 0;font-size:13px;color:#6b7280;line-height:1.6;font-style:italic;">
        Note: This OTP is valid for 5 minutes. If you did not request this code, please secure your account and contact the system administrator immediately.
      </p>
      <p style="margin:24px 0 4px;font-size:15px;color:#374151;">Best regards,</p>
      <p style="margin:0;font-size:15px;color:#374151;font-weight:600;">CRM-KOC System</p>
    `;

    await sgMail.send({
      from: this.from,
      to,
      subject: '[CRM-KOC] Action Required: Your Login OTP',
      text: `Hello ${displayName},\n\nYou are attempting to log in to the CRM-KOC platform.\n\nYour One-Time Password (OTP) for verification is: ${otp}\n\nNote: This OTP is valid for 5 minutes. If you did not request this code, please secure your account and contact the system administrator immediately.\n\nBest regards,\nCRM-KOC System`,
      html: this.getBaseHtml(content),
    });

    this.logger.warn(`OTP for ${to} is: ${otp}`);
  }

  async sendKycStatusNotification(opts: {
    to: string;
    displayName: string;
    status: string;
    rejectReason?: string | null;
    reviewNote?: string | null;
  }): Promise<boolean> {
    if (!(await this.isSystemEmailActive())) {
      this.logger.warn(
        `Email Service Toggled Off. Dropping KYC status notification to ${opts.to}.`,
      );
      return false;
    }

    let detailSection = '';
    if (opts.rejectReason) {
      detailSection += `<p style="margin:0 0 10px;font-size:15px;color:#374151;"><strong>Reason:</strong> ${opts.rejectReason}</p>`;
    }
    if (opts.reviewNote) {
      detailSection += `<p style="margin:0 0 10px;font-size:15px;color:#374151;"><strong>Note:</strong> ${opts.reviewNote}</p>`;
    }

    const content = `
      <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hello <strong>${opts.displayName}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        Your KYC submission status has been updated to: <strong style="text-transform: uppercase;">${opts.status}</strong>.
      </p>
      ${detailSection ? `<div style="background:#f3f4f6;padding:16px;border-radius:6px;margin-bottom:16px;">${detailSection}</div>` : ''}
      <p style="margin:16px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
        Please log in to your CRM-KOC dashboard to review your account status and take necessary actions if required.
      </p>
    `;

    // KHÔNG bắt lỗi ở đây: lỗi phải nổi lên cho BullMQ retry. Nuốt lỗi thì job
    // luôn "thành công" và toàn bộ cơ chế retry thành vô nghĩa.
    await sgMail.send({
      from: this.from,
      to: opts.to,
      subject: `[CRM-KOC] KYC Status Update: ${opts.status.toUpperCase()}`,
      text: `Hello ${opts.displayName},\n\nYour KYC submission status has been updated to: ${opts.status.toUpperCase()}.\n\nBest regards,\nCRM-KOC System`,
      html: this.getBaseHtml(content),
    });
    return true;
  }
}
