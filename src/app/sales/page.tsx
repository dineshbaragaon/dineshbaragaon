import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { leadInclude } from "@/lib/lead-query";
import { Shell } from "@/components/Shell";
import { SalesLeadList } from "@/components/sales/SalesLeadList";

export default async function SalesPage() {
  const user = await requireRole("SALES_MANAGER");

  const leads = await prisma.lead.findMany({
    where: { salesManagerId: user.id },
    include: leadInclude,
    orderBy: { updatedAt: "desc" },
  });

  const activeCount = leads.filter((l) => l.status === "ASSIGNED_TO_SALES" || l.status === "IN_PROGRESS").length;
  const convertedCount = leads.filter((l) => l.status === "CONVERTED").length;

  return (
    <Shell
      title="My pipeline"
      subtitle="Work qualified leads through to a conversion or a close."
      userName={user.name ?? ""}
      role={user.role}
    >
      <div className="mb-6 flex gap-4 text-sm text-slate-500">
        <span>{leads.length} total</span>
        <span className="font-medium text-indigo-700">{activeCount} active</span>
        <span className="font-medium text-green-700">{convertedCount} converted</span>
      </div>

      <SalesLeadList leads={leads} />
    </Shell>
  );
}
