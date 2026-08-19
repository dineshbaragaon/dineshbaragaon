import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { generateToken, TOKEN_VALIDITY_MS } from "@/lib/tokens";

// Always responds with the same generic message, whether or not the email
// exists or the account is archived — avoids leaking which accounts exist.
const GENERIC_MESSAGE = "If that email has an account, a reset link is on its way.";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (user && user.active) {
    const token = generateToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordSetToken: token, passwordSetTokenExpires: new Date(Date.now() + TOKEN_VALIDITY_MS) },
    });

    await sendPasswordResetEmail({ to: user.email, name: user.name, token });
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
