import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/Shell";
import { UserManagement } from "@/components/admin/UserManagement";

export default async function AdminUsersPage() {
  const user = await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell
      title="Manage users"
      subtitle="Create accounts for freelancers, team qualifiers, and sales managers using their Gmail address."
      userName={user.name ?? ""}
      role={user.role}
    >
      <div className="mb-4">
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to leads
        </Link>
      </div>
      <UserManagement users={users} />
    </Shell>
  );
}
