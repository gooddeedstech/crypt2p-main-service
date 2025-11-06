import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('EMAIL_HOST'),
      port: this.config.get<number>('EMAIL_PORT'),
      secure: true, // TLS handled automatically for port 587
      auth: {
        user: this.config.get('EMAIL_USERNAME'),
        pass: this.config.get('EMAIL_PASSWORD'),
      },
    });
  }
  async sendOtp(email: string, code: string) {
    const subject = 'Verify Your Crypt2P Account';

    const appName = 'Crypt2P';
    const logoUrl = 'https://api.crypt2p.com/assets/logo.png'; // ✅ Replace with your real hosted logo
    const expiresIn = this.config.get('EMAIL_VERIFY_OTP_TTL') || 30;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #F6F8FA;
      padding: 0; margin: 0;
    }

    .container {
      max-width: 450px;
      margin: 40px auto;
      background: #FFFFFF;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.07);
      text-align: center;
    }

    img.logo {
      width: 160px;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 20px;
      font-weight: 600;
      color: #111;
    }

    p {
      font-size: 15px;
      color: #444;
      margin: 12px 0;
    }

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

    .button {
      display: inline-block;
      background: #0A7A47;
      color: #fff !important;
      text-decoration: none;
      padding: 14px 24px;
      border-radius: 8px;
      margin-top: 16px;
      font-size: 16px;
      font-weight: bold;
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

    <img src="${logoUrl}" class="logo" alt="${appName}">

    <h1>Verify Your Email</h1>

    <p>Enter this OTP code in the Crypt2P app to confirm your identity:</p>

    <div class="otp-box">${code}</div>

    <a class="button"
      href="https://app.crypt2p.com/verify?email=${encodeURIComponent(email)}&code=${code}">
      Verify Email
    </a>

    <p>This code expires in <b>${expiresIn} minutes</b>.</p>

    <p>If you didn’t request this, please ignore this email.</p>

    <p class="footer-text">
      &copy; ${new Date().getFullYear()} Crypt2P • Secure Digital Asset Exchange
    </p>
  </div>
</body>
</html>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM'),
        to: email,
        subject,
        html,
      });

      this.logger.log(`✅ OTP email sent to ${email}`);
      return { sent: true };

    } catch (error) {
      this.logger.error(`❌ Failed to send OTP email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordReset(email: string, code: string) {
  const subject = 'Reset Your Password – Crypt2P';

  const appName = 'Crypt2P';
  const logoUrl = 'https://api.crypt2p.com/assets/logo.png'; // ✅ replace with your own hosted logo
  const expiresIn = this.config.get('EMAIL_RESET_TTL_MIN') || 30;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="supported-color-schemes" content="light dark"/>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #F6F8FA;
      margin:0;
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
    img.logo {
      width: 160px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      color: #111;
      margin-bottom: 12px;
    }
    p {
      color: #444;
      font-size: 15px;
      margin: 12px 0;
    }
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

    <img src="${logoUrl}" class="logo" alt="${appName}"/>

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

    <p class="footer-text">
      &copy; ${new Date().getFullYear()} Crypt2P — Secure Digital Asset Exchange
    </p>
  </div>
</body>
</html>
  `;

  return this.transporter.sendMail({
    from: this.config.get('EMAIL_FROM'),
    to: email,
    subject,
    html,
  });
}
  
}