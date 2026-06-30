// FILE: src/services/email.service.js
// PURPOSE: Transactional email via SMTP (Nodemailer). Configure via env vars:
//   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM, FRONTEND_URL

import nodemailer from 'nodemailer';

function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT ?? '587', 10),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function sendPasswordResetEmail(toEmail, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const transporter = createTransporter();
  if (!transporter) {
    // Dev fallback: log to console when SMTP not configured
    console.log('[Email] SMTP not configured. Password reset link:');
    console.log(`[Email] ${resetUrl}`);
    return { ok: true, devMode: true };
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? `VibeScout <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Reset your VibeScout password',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 520px; margin: 0 auto; background: #080812; color: #fff; border-radius: 12px; padding: 40px 32px;">
        <div style="margin-bottom: 28px;">
          <p style="font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #0DD8C0; margin: 0 0 12px;">
            VIBESCOUT INTELLIGENCE
          </p>
          <h1 style="font-size: 24px; font-weight: 500; color: rgba(255,255,255,0.92); margin: 0 0 8px;">
            Reset your password
          </h1>
          <p style="font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.6; margin: 0;">
            We received a request to reset the password for your VibeScout account.
          </p>
        </div>

        <a href="${resetUrl}" style="display: inline-block; padding: 13px 28px; background: #0DD8C0; color: #080812; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; margin-bottom: 24px;">
          Reset password →
        </a>

        <p style="font-size: 12px; color: rgba(255,255,255,0.3); line-height: 1.6; margin: 0 0 8px;">
          This link expires in <strong style="color: rgba(255,255,255,0.5);">1 hour</strong>.
          If you didn't request a reset, you can safely ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />

        <p style="font-size: 11px; color: rgba(255,255,255,0.2); margin: 0;">
          Or copy this link: <span style="color: rgba(13,216,192,0.6);">${resetUrl}</span>
        </p>
      </div>
    `,
    text: `Reset your VibeScout password\n\nLink: ${resetUrl}\n\nExpires in 1 hour. Ignore if you didn't request this.`,
  });

  return { ok: true };
}
