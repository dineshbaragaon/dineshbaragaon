import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { passwordSetToken: token } });

  if (!user || !user.passwordSetTokenExpires || user.passwordSetTokenExpires < new Date()) {
    return NextResponse.json({ error: "This link is invalid or has expired" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordSetToken: null, passwordSetTokenExpires: null },
  });

  return NextResponse.json({ ok: true });
}
