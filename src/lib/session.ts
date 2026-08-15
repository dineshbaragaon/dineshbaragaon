import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireRole(...roles: Role[]) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!roles.includes(session.user.role)) {
    redirect(ROLE_HOME[session.user.role]);
  }

  return session.user;
}
