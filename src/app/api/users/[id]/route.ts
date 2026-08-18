import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendInviteEmail } from "@/lib/mailer";
import { generateToken, TOKEN_VALIDITY_MS } from "@/lib/tokens";
import { ROLE_LABEL } from "@/lib/roles";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.resendInvite === true) {
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const token = generateToken();
    await prisma.user.update({
      where: { id },
      data: { passwordSetToken: token, passwordSetTokenExpires: new Date(Date.now() + TOKEN_VALIDITY_MS) },
    });

    const emailResult = await sendInviteEmail({
      to: target.email,
      name: target.name,
      role: ROLE_LABEL[target.role],
      token,
    });

    return NextResponse.json({ emailResult });
  }

  const data: { active?: boolean; passwordHash?: string; passwordSetToken?: null; passwordSetTokenExpires?: null } = {};

  if (typeof body.active === "boolean") {
    data.active = body.active;
  }

  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(body.password, 10);
    data.passwordSetToken = null;
    data.passwordSetTokenExpires = null;
  }

  const row = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, passwordHash: true },
  });

  const { passwordHash, ...rest } = row;
  return NextResponse.json({ user: { ...rest, pending: passwordHash === null } });
}
