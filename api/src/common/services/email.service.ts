import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisClientType } from 'redis';
import sgMail from '@sendgrid/mail';

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

    // Dev/Debug requirement: Log OTP to console on success
    console.log(`[SUCCESS] OTP for ${to} is: ${otp}`);
  }

  async sendCriticalFxAlertEmail(
    toEmails: string[],
    lastSuccessfulTime: string,
  ): Promise<void> {
    if (!toEmails || toEmails.length === 0) return;
    if (!(await this.isSystemEmailActive())) {
      this.logger.warn(
        'Email Service Toggled Off. Dropping sendCriticalFxAlertEmail.',
      );
      return;
    }

    const content = `
      <p style="margin:0 0 16px;font-size:16px;color:#dc2626;font-weight:bold;">[CRITICAL] FX Rate Sync Delay</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hello Admin,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        The system has failed to sync FX rates from the provider for more than <strong>30 minutes</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        <strong>Last successful sync:</strong> ${lastSuccessfulTime}
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        Please check the currency provider connection or API key immediately.
      </p>
    `;

    try {
      await sgMail.sendMultiple({
        from: this.from,
        to: toEmails,
        subject: '[CRM-KOC Alert] CRITICAL: FX Rate Sync Delay (> 30 mins)',
        html: this.getBaseHtml(content),
      });
    } catch (err) {
      this.logger.error('Failed to send Critical FX Alert email', err);
    }
  }

  async sendEmergencyFxAlertEmail(
    toEmails: string[],
    lastSuccessfulTime: string,
  ): Promise<void> {
    if (!toEmails || toEmails.length === 0) return;
    if (!(await this.isSystemEmailActive())) {
      this.logger.warn(
        'Email Service Toggled Off. Dropping sendEmergencyFxAlertEmail.',
      );
      return;
    }

    const content = `
      <p style="margin:0 0 16px;font-size:16px;color:#991b1b;font-weight:bold;">[EMERGENCY] FX Rate Sync Outage</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hello Admin,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        The system has failed to sync FX rates from the provider for more than <strong>3 hours</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        <strong>Last successful sync:</strong> ${lastSuccessfulTime}
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        The system might be using extremely outdated rates which poses a financial risk. Immediate action is required.
      </p>
    `;

    try {
      await sgMail.sendMultiple({
        from: this.from,
        to: toEmails,
        subject: '[CRM-KOC Alert] EMERGENCY: FX Rate Sync Outage (> 3 hours)',
        html: this.getBaseHtml(content),
      });
    } catch (err) {
      this.logger.error('Failed to send Emergency FX Alert email', err);
    }
  }

  async sendRecoveryFxAlertEmail(
    toEmails: string[],
    outageDurationMinutes: number,
  ): Promise<void> {
    if (!toEmails || toEmails.length === 0) return;
    if (!(await this.isSystemEmailActive())) {
      this.logger.warn(
        'Email Service Toggled Off. Dropping sendRecoveryFxAlertEmail.',
      );
      return;
    }

    const content = `
      <p style="margin:0 0 16px;font-size:16px;color:#16a34a;font-weight:bold;">[RESOLVED] FX Rate Sync Restored</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hello Admin,</p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        The FX rate synchronization has been successfully restored.
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
        <strong>Total outage duration:</strong> ${outageDurationMinutes} minutes.
      </p>
    `;

    try {
      await sgMail.sendMultiple({
        from: this.from,
        to: toEmails,
        subject: '[CRM-KOC Alert] RESOLVED: FX Rate Sync Restored',
        html: this.getBaseHtml(content),
      });
    } catch (err) {
      this.logger.error('Failed to send Recovery FX Alert email', err);
    }
  }

  async sendKycStatusNotification(opts: {
    to: string;
    displayName: string;
    status: string;
    rejectReason?: string | null;
    reviewNote?: string | null;
  }): Promise<void> {
    if (!(await this.isSystemEmailActive())) {
      this.logger.warn(
        `Email Service Toggled Off. Dropping KYC status notification to ${opts.to}.`,
      );
      return;
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

    try {
      await sgMail.send({
        from: this.from,
        to: opts.to,
        subject: `[CRM-KOC] KYC Status Update: ${opts.status.toUpperCase()}`,
        text: `Hello ${opts.displayName},\n\nYour KYC submission status has been updated to: ${opts.status.toUpperCase()}.\n\nBest regards,\nCRM-KOC System`,
        html: this.getBaseHtml(content),
      });
    } catch (err) {
      this.logger.error(
        `Failed to send KYC notification email to ${opts.to}`,
        err,
      );
    }
  }
}
