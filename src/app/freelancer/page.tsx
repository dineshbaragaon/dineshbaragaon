import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { leadInclude } from "@/lib/lead-query";
import { Shell } from "@/components/Shell";
import { FreelancerLeadList } from "@/components/freelancer/FreelancerLeadList";
import { ExportButton } from "@/components/ExportButton";

export default async function FreelancerPage() {
  const user = await requireRole("FREELANCER");

  const [leads, assignments] = await Promise.all([
    prisma.lead.findMany({
      where: { freelancerId: user.id },
      include: leadInclude,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.requirementAssignment.findMany({
      where: { freelancerId: user.id, profile: { active: true } },
      select: { profile: { select: { id: true, title: true } } },
    }),
  ]);
  const profiles = assignments.map((a) => a.profile);

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
        <div className="flex gap-2">
          <ExportButton />
          <Link
            href="/freelancer/requirements"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Requirements{profiles.length > 0 ? ` (${profiles.length})` : ""}
          </Link>
          <Link
            href="/freelancer/new"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            + Submit lead
          </Link>
        </div>
      </div>

      <FreelancerLeadList leads={leads} profiles={profiles} />
    </Shell>
  );
}
