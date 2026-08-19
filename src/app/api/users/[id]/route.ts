import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
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

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.role === "ADMIN" && target.active) {
    const otherActiveAdmins = await prisma.user.count({
      where: { role: "ADMIN", active: true, id: { not: id } },
    });
    if (otherActiveAdmins === 0) {
      return NextResponse.json({ error: "Can't delete the only active admin account" }, { status: 400 });
    }
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        { error: "This user has leads or comments tied to them — archive the account instead of deleting it" },
        { status: 409 },
      );
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
