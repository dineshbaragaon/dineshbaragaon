import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { leadIncludeFor } from "@/lib/lead-query";
import { Shell } from "@/components/Shell";
import { QualifierLeadList } from "@/components/qualify/QualifierLeadList";
import { ExportButton } from "@/components/ExportButton";

export default async function QualifyPage() {
  const user = await requireRole("QUALIFIER");

  const leads = await prisma.lead.findMany({
    where: { qualifierId: user.id },
    include: leadIncludeFor(user.role),
    orderBy: { updatedAt: "desc" },
  });

  const pendingCount = leads.filter((l) => l.status === "IN_QUALIFICATION").length;

  return (
    <Shell
      title="Leads to qualify"
      subtitle="Review leads assigned to you and decide whether they're ready for sales."
      userName={user.name ?? ""}
      role={user.role}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4 text-sm text-slate-500">
          <span>{leads.length} total</span>
          {pendingCount > 0 && <span className="font-medium text-amber-700">{pendingCount} awaiting decision</span>}
        </div>
        <ExportButton />
      </div>

      <QualifierLeadList leads={leads} />
    </Shell>
  );
}
