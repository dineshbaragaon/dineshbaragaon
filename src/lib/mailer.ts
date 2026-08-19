import nodemailer from "nodemailer";

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

type SendResult = { sent: boolean; error?: string };

async function sendPasswordLinkEmail(params: {
  to: string;
  subject: string;
  heading: string;
  intro: string;
  buttonLabel: string;
  token: string;
}): Promise<SendResult> {
  const transport = getTransport();
  if (!transport) {
    return { sent: false, error: "Email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing)" };
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/set-password?token=${params.token}`;

  try {
    await transport.sendMail({
      from: `LeadFlow <${process.env.GMAIL_USER}>`,
      to: params.to,
      subject: params.subject,
      text: `${params.intro}\n\n${params.buttonLabel}:\n${link}\n\nThis link expires in 7 days. If you didn't expect this, you can ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0f172a;">${escapeHtml(params.heading)}</h2>
          <p>${escapeHtml(params.intro)}</p>
          <p>
            <a href="${link}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin: 12px 0;">
              ${escapeHtml(params.buttonLabel)}
            </a>
          </p>
          <p style="color: #64748b; font-size: 14px;">This link expires in 7 days. If you didn't expect this, you can ignore this email.</p>
        </div>
      `,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

export function sendInviteEmail(params: { to: string; name: string; role: string; token: string }) {
  return sendPasswordLinkEmail({
    to: params.to,
    subject: "Your LeadFlow account is ready — set your password",
    heading: "Welcome to LeadFlow",
    intro: `Hi ${params.name}, an account has been created for you on LeadFlow as a ${params.role}.`,
    buttonLabel: "Set your password",
    token: params.token,
  });
}

export function sendPasswordResetEmail(params: { to: string; name: string; token: string }) {
  return sendPasswordLinkEmail({
    to: params.to,
    subject: "Reset your LeadFlow password",
    heading: "Reset your password",
    intro: `Hi ${params.name}, someone requested a password reset for your LeadFlow account. If this was you, choose a new password below.`,
    buttonLabel: "Reset your password",
    token: params.token,
  });
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
