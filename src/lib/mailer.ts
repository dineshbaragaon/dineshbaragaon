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

async function sendLinkEmail(params: {
  to: string;
  subject: string;
  heading: string;
  intro: string;
  buttonLabel: string;
  link: string;
  footer?: string;
}): Promise<SendResult> {
  const transport = getTransport();
  if (!transport) {
    return { sent: false, error: "Email is not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing)" };
  }

  const footer = params.footer ?? "";

  try {
    await transport.sendMail({
      from: `LeadFlow <${process.env.GMAIL_USER}>`,
      to: params.to,
      subject: params.subject,
      text: `${params.intro}\n\n${params.buttonLabel}:\n${params.link}${footer ? `\n\n${footer}` : ""}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0f172a;">${escapeHtml(params.heading)}</h2>
          <p style="white-space: pre-wrap;">${escapeHtml(params.intro)}</p>
          <p>
            <a href="${params.link}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin: 12px 0;">
              ${escapeHtml(params.buttonLabel)}
            </a>
          </p>
          ${footer ? `<p style="color: #64748b; font-size: 14px;">${escapeHtml(footer)}</p>` : ""}
        </div>
      `,
    });
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "Unknown email error" };
  }
}

function baseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export function sendInviteEmail(params: { to: string; name: string; role: string; token: string }) {
  return sendLinkEmail({
    to: params.to,
    subject: "Your LeadFlow account is ready — set your password",
    heading: "Welcome to LeadFlow",
    intro: `Hi ${params.name}, an account has been created for you on LeadFlow as a ${params.role}.`,
    buttonLabel: "Set your password",
    link: `${baseUrl()}/set-password?token=${params.token}`,
    footer: "This link expires in 7 days. If you didn't expect this, you can ignore this email.",
  });
}

export function sendPasswordResetEmail(params: { to: string; name: string; token: string }) {
  return sendLinkEmail({
    to: params.to,
    subject: "Reset your LeadFlow password",
    heading: "Reset your password",
    intro: `Hi ${params.name}, someone requested a password reset for your LeadFlow account. If this was you, choose a new password below.`,
    buttonLabel: "Reset your password",
    link: `${baseUrl()}/set-password?token=${params.token}`,
    footer: "This link expires in 7 days. If you didn't expect this, you can ignore this email.",
  });
}

export function sendRequirementProfileEmail(params: { to: string; name: string; title: string; description: string }) {
  return sendLinkEmail({
    to: params.to,
    subject: `New lead requirement: ${params.title}`,
    heading: params.title,
    intro: `Hi ${params.name}, your admin has added a new lead requirement for you:\n\n"${params.description}"`,
    buttonLabel: "View in Requirements",
    link: `${baseUrl()}/freelancer/requirements`,
  });
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
