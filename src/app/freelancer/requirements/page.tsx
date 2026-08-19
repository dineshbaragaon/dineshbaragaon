import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/Shell";
import { RequirementsList } from "@/components/freelancer/RequirementsList";

export default async function FreelancerRequirementsPage() {
  const user = await requireRole("FREELANCER");

  const assignments = await prisma.requirementAssignment.findMany({
    where: { freelancerId: user.id, profile: { active: true } },
    include: { profile: { select: { id: true, title: true, description: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Shell
      title="Requirements"
      subtitle="Guidance from your admin on the kind of clients and leads to bring in."
      userName={user.name ?? ""}
      role={user.role}
    >
      <div className="mb-4">
        <Link href="/freelancer" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to my leads
        </Link>
      </div>
      <RequirementsList profiles={assignments.map((a) => a.profile)} />
    </Shell>
  );
}
