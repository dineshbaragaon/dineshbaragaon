import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { leadInclude } from "@/lib/lead-query";
import { Shell } from "@/components/Shell";
import { FreelancerLeadList } from "@/components/freelancer/FreelancerLeadList";

export default async function FreelancerPage() {
  const user = await requireRole("FREELANCER");

  const leads = await prisma.lead.findMany({
    where: { freelancerId: user.id },
    include: leadInclude,
    orderBy: { updatedAt: "desc" },
  });

  const needsReworkCount = leads.filter((l) => l.status === "NEEDS_REWORK").length;

  return (
    <Shell
      title="My leads"
      subtitle="Submit new leads and track their status through qualification and sales."
      userName={user.name ?? ""}
      role={user.role}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-4 text-sm text-slate-500">
          <span>{leads.length} total</span>
          {needsReworkCount > 0 && (
            <span className="font-medium text-orange-700">{needsReworkCount} need rework</span>
          )}
        </div>
        <Link
          href="/freelancer/new"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          + Submit lead
        </Link>
      </div>

      <FreelancerLeadList leads={leads} />
    </Shell>
  );
}
