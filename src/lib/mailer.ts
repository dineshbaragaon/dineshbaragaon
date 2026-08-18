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

export async function sendInviteEmail(params: {
  to: string;
  name: string;
  role: string;
  token: string;
}): Promise<{ sent: boolean; error?: string }> {
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
      subject: "Your LeadFlow account is ready — set your password",
      text: `Hi ${params.name},\n\nAn account has been created for you on LeadFlow as a ${params.role}.\n\nSet your password to get started:\n${link}\n\nThis link expires in 7 days. If you didn't expect this, you can ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0f172a;">Welcome to LeadFlow</h2>
          <p>Hi ${escapeHtml(params.name)},</p>
          <p>An account has been created for you as a <strong>${escapeHtml(params.role)}</strong>.</p>
          <p>
            <a href="${link}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin: 12px 0;">
              Set your password
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

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
