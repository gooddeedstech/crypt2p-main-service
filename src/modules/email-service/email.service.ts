import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly mailgunClient;
  private readonly domain: string;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('MAILGUN_API_KEY');
    const domain = this.config.get<string>('MAILGUN_DOMAIN');
    const from = this.config.get<string>('MAILGUN_FROM') || `Crypt2P <postmaster@${domain}>`;

    if (!apiKey || !domain) {
      throw new Error('❌ Mailgun configuration missing: set MAILGUN_API_KEY and MAILGUN_DOMAIN in .env');
    }

    const mailgun = new Mailgun(FormData);
    this.mailgunClient = mailgun.client({
      username: 'api',
      key: apiKey,
      // Optional: uncomment if your domain is EU-based
      // url: 'https://api.eu.mailgun.net',
    });

    this.domain = domain;
    this.fromEmail = from;
  }

  /* --------------------------------------------------------
   ✅ SEND OTP EMAIL
  -------------------------------------------------------- */
  async sendOtp(email: string, code: string) {
    const subject = 'Verify Your Crypt2P Account';
    const appName = 'Crypt2P';
    const logoUrl = 'https://api.crypt2p.com/assets/logo.png';
    const expiresIn = this.config.get<number>('EMAIL_VERIFY_OTP_TTL') || 30;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #F6F8FA;
      padding: 0;
      margin: 0;
    }
    .container {
      max-width: 450px;
      margin: 40px auto;
      background: #fff;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.07);
      text-align: center;
    }
    img.logo { width: 160px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 600; color: #111; }
    p { font-size: 15px; color: #444; margin: 12px 0; }
    .otp-box {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 6px;
      background: #F1F5F9;
      padding: 14px 0;
      border-radius: 8px;
      color: #0A7A47;
      margin: 20px 0;
    }
    .footer-text {
      font-size: 12px;
      color: #666;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="${logoUrl}" class="logo" alt="${appName}" />
    <h1>Verify Your Email</h1>
    <p>Enter this OTP code in the Crypt2P app to confirm your identity:</p>
    <div class="otp-box">${code}</div>
    <p>This code expires in <b>${expiresIn} minutes</b>.</p>
    <p>If you didn’t request this, please ignore this email.</p>
    <p class="footer-text">&copy; ${new Date().getFullYear()} Crypt2P • Secure Digital Asset Exchange</p>
  </div>
</body>
</html>`;

    try {
      const response = await this.mailgunClient.messages.create(this.domain, {
        from: this.fromEmail,
        to: [email],
        subject,
        html,
      });

      this.logger.log(`✅ OTP email sent to ${email}`);
      return response;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send OTP email to ${email}: ${error.message}`);
      throw error;
    }
  }

  /* --------------------------------------------------------
   ✅ SEND PASSWORD RESET EMAIL
  -------------------------------------------------------- */
  async sendPasswordReset(email: string, code: string) {
    const subject = 'Reset Your Password – Crypt2P';
    const appName = 'Crypt2P';
    const logoUrl = 'https://api.crypt2p.com/assets/logo.png';
    const expiresIn = this.config.get<number>('EMAIL_RESET_TTL_MIN') || 30;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #F6F8FA;
      margin: 0;
    }
    .container {
      max-width: 450px;
      margin: 40px auto;
      background: #FFFFFF;
      padding: 32px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.07);
    }
    img.logo { width: 160px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 600; color: #111; }
    p { color: #444; font-size: 15px; margin: 12px 0; }
    .otp-box {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 6px;
      background: #F1F5F9;
      padding: 14px 0;
      border-radius: 8px;
      color: #B41414;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: #0A7A47;
      color: #fff;
      padding: 14px 24px;
      border-radius: 8px;
      text-decoration: none !important;
      font-size: 16px;
      margin-top: 14px;
    }
    .footer-text {
      font-size: 12px;
      color: #666;
      margin-top: 28px;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="${logoUrl}" class="logo" alt="${appName}" />
    <h1>Password Reset Request</h1>
    <p>We received a request to reset your Crypt2P password.</p>
    <p>Please use the code below to continue:</p>
    <div class="otp-box">${code}</div>
    <a class="button"
      href="https://app.crypt2p.com/reset-password?email=${encodeURIComponent(email)}&code=${code}">
      Reset Password
    </a>
    <p>This code expires in <b>${expiresIn} minutes</b> and can only be used once.</p>
    <p>If you did not request a password reset, please secure your account.</p>
    <p class="footer-text">&copy; ${new Date().getFullYear()} Crypt2P — Secure Digital Asset Exchange</p>
  </div>
</body>
</html>`;

    try {
      const response = await this.mailgunClient.messages.create(this.domain, {
        from: this.fromEmail,
        to: [email],
        subject,
        html,
      });

      this.logger.log(`✅ Password reset email sent to ${email}`);
      return response;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send password reset email to ${email}: ${error.message}`);
      throw error;
    }
  }


async sendBvnVerificationResult(
  email: string,
  success: boolean,
  failureReason?: string,
) {
  const appName = 'Crypt2P';
  const logoUrl = 'https://api.crypt2p.com/assets/logo.png';
  const subject = success
    ? 'BVN Verification Successful – Account Activated'
    : 'BVN Verification Failed – Action Required';

  const message = success
    ? `
      <p>Dear Valued User,</p>
      <p>Your BVN verification was <b style="color:#0A7A47;">successful</b>.</p>
      <p>Your account has been activated and your KYC Level is now <b>Level 1 (Basic Verification)</b>.</p>
      <p>You can now perform transactions seamlessly on ${appName}.</p>
    `
    : `
      <p>Dear User,</p>
      <p>Unfortunately, your BVN verification <b style="color:#B41414;">failed</b>.</p>
      <p><b>Reason:</b> ${failureReason || 'BVN verification could not be completed at this time.'}</p>
      <p>Please review your BVN details and try again. You can also contact our support team for help.</p>
      <a href="https://app.crypt2p.com/kyc"
         class="button">
         Retry BVN Verification
      </a>
    `;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #F6F8FA;
      margin: 0;
      padding: 0;
    }

    .container {
      max-width: 480px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
      padding: 32px;
    }

    .header {
      text-align: center;
      margin-bottom: 24px;
    }

    img.logo {
      width: 160px;
      margin-bottom: 12px;
    }

    h1 {
      font-size: 20px;
      font-weight: 600;
      color: #111;
      margin-bottom: 12px;
      text-align: center;
    }

    p {
      font-size: 15px;
      color: #444;
      margin: 12px 0;
      line-height: 1.6;
      text-align: left;
    }

    .button {
      display: inline-block;
      background: #0A7A47;
      color: #fff !important;
      text-decoration: none;
      padding: 12px 20px;
      border-radius: 6px;
      margin-top: 16px;
      font-size: 15px;
      font-weight: 600;
    }

    .footer-text {
      font-size: 12px;
      color: #666;
      margin-top: 28px;
      border-top: 1px solid #E5E7EB;
      padding-top: 12px;
      text-align: center;
    }

    .icon-wrapper {
      text-align: center;
      margin: 16px 0;
    }

    .success-icon {
      width: 64px;
    }

    .fail-icon {
      width: 64px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" class="logo" alt="${appName} Logo" />
      <h1>${subject}</h1>
    </div>

    <div class="icon-wrapper">
      ${
        success
          ? `<img class="success-icon" src="https://api.crypt2p.com/assets/success.png" alt="Success Icon" />`
          : `<img class="fail-icon" src="https://api.crypt2p.com/assets/error.png" alt="Error Icon" />`
      }
    </div>

    <div class="content">
      ${message}
    </div>

    <p class="footer-text">
      &copy; ${new Date().getFullYear()} ${appName} — Secure Digital Asset Exchange
      <br />
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

  try {
    const response = await this.mailgunClient.messages.create(this.domain, {
      from: this.fromEmail,
      to: [email],
      subject,
      html,
    });

    this.logger.log(`✅ BVN verification email sent to ${email}`);
    return response;
  } catch (error: any) {
    this.logger.error(`❌ Failed to send BVN verification email: ${error.message}`);
    throw error;
  }
}

async sendGenericNotification(email: string, title: string, message: string) {
  const appName = 'Crypt2P';
  const logoUrl = 'https://api.crypt2p.com/assets/logo.png';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style>
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F6F8FA;
      margin: 0;
      padding: 0;
      color: #111827;
    }

    .container {
      max-width: 480px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
      padding: 32px;
      text-align: left;
    }

    .header {
      text-align: center;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    img.logo {
      width: 150px;
      height: auto;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0A7A47;
      margin-bottom: 8px;
    }

    p {
      font-size: 15px;
      line-height: 1.6;
      color: #374151;
      margin: 10px 0;
    }

    .content-box {
      background: #F9FAFB;
      border-radius: 10px;
      padding: 18px 20px;
      margin: 20px 0;
      border-left: 4px solid #0A7A47;
    }

    .footer {
      font-size: 12px;
      color: #6B7280;
      text-align: center;
      margin-top: 30px;
      border-top: 1px solid #E5E7EB;
      padding-top: 16px;
    }

    a.button {
      display: inline-block;
      background-color: #0A7A47;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 22px;
      border-radius: 8px;
      margin-top: 16px;
      font-weight: 600;
      font-size: 15px;
    }

    .highlight {
      color: #0A7A47;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" class="logo" alt="${appName} Logo" />
    </div>

    <h1>${title}</h1>

    <div class="content-box">
      <p>${message}</p>
    </div>

    <p>If you have any questions or need help, reach out to our support team.</p>

    <p style="text-align:center;">
      <a href="https://app.crypt2p.com" class="button">Go to ${appName}</a>
    </p>

    <div class="footer">
      &copy; ${new Date().getFullYear()} ${appName} — Secure Digital Asset Exchange<br />
      This is an automated message. Please do not reply to this email.
    </div>
  </div>
</body>
</html>
  `;

  try {
    const response = await this.mailgunClient.messages.create(this.domain, {
      from: this.fromEmail,
      to: [email],
      subject: title,
      html,
    });

    this.logger.log(`✅ Generic email sent to ${email}`);
    return response;
  } catch (error: any) {
    this.logger.error(`❌ Failed to send email: ${error.message}`);
    throw error;
  }
}
}