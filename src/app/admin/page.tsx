import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { leadInclude } from "@/lib/lead-query";
import { Shell } from "@/components/Shell";
import { AdminLeadList } from "@/components/admin/AdminLeadList";

export default async function AdminPage() {
  const user = await requireRole("ADMIN");

  const [leads, qualifiers, salesManagers] = await Promise.all([
    prisma.lead.findMany({ include: leadInclude, orderBy: { updatedAt: "desc" } }),
    prisma.user.findMany({
      where: { role: "QUALIFIER", active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "SALES_MANAGER", active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const newCount = leads.filter((l) => l.status === "NEW").length;
  const qualifiedCount = leads.filter((l) => l.status === "QUALIFIED").length;

  return (
    <Shell
      title="All leads"
      subtitle="Assign submitted leads to your team for qualification, then hand qualified leads to sales."
      userName={user.name ?? ""}
      role={user.role}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-sm text-slate-500">
          <span>{leads.length} total</span>
          {newCount > 0 && <span className="font-medium text-slate-700">{newCount} unassigned</span>}
          {qualifiedCount > 0 && (
            <span className="font-medium text-emerald-700">{qualifiedCount} awaiting sales assignment</span>
          )}
        </div>
        <Link href="/admin/users" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Manage users
        </Link>
      </div>

      <AdminLeadList leads={leads} qualifiers={qualifiers} salesManagers={salesManagers} />
    </Shell>
  );
}
