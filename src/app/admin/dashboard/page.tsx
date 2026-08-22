import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/Shell";
import { PipelineDashboard } from "@/components/admin/PipelineDashboard";
import { computePipelineStats } from "@/lib/pipeline-stats";

export default async function AdminDashboardPage() {
  const user = await requireRole("ADMIN");

  const leads = await prisma.lead.findMany({
    select: {
      status: true,
      registered: true,
      transactionLive: true,
      freelancer: { select: { id: true, name: true } },
      qualifier: { select: { id: true, name: true } },
      salesManager: { select: { id: true, name: true } },
      requirementProfile: { select: { id: true, title: true } },
    },
  });

  const stats = computePipelineStats(leads);

  return (
    <Shell
      title="Pipeline dashboard"
      subtitle="All-time numbers across the whole funnel — use this to balance workload and see what's actually converting."
      userName={user.name ?? ""}
      role={user.role}
    >
      <div className="mb-4">
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to leads
        </Link>
      </div>
      <PipelineDashboard stats={stats} />
    </Shell>
  );
}
