import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendInviteEmail } from "@/lib/mailer";
import { generateToken, TOKEN_VALIDITY_MS } from "@/lib/tokens";
import { ROLE_LABEL } from "@/lib/roles";
import type { Role } from "@prisma/client";

const VALID_ROLES: Role[] = ["FREELANCER", "QUALIFIER", "SALES_MANAGER", "ADMIN"];

export async function GET() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rows = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true, passwordHash: true },
    orderBy: { createdAt: "desc" },
  });

  const users = rows.map(({ passwordHash, ...rest }) => ({ ...rest, pending: passwordHash === null }));

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { name, email, role } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const token = generateToken();

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role,
      passwordHash: null,
      passwordSetToken: token,
      passwordSetTokenExpires: new Date(Date.now() + TOKEN_VALIDITY_MS),
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  const emailResult = await sendInviteEmail({
    to: user.email,
    name: user.name,
    role: ROLE_LABEL[user.role],
    token,
  });

  return NextResponse.json({ user: { ...user, pending: true }, emailResult }, { status: 201 });
}
