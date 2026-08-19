import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/Shell";
import { AdminRequirementsList } from "@/components/admin/AdminRequirementsList";

export default async function AdminRequirementsPage() {
  const user = await requireRole("ADMIN");

  const [profiles, freelancers] = await Promise.all([
    prisma.requirementProfile.findMany({
      include: {
        createdBy: { select: { name: true } },
        assignments: {
          include: { freelancer: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { role: "FREELANCER", active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <Shell
      title="Requirements"
      subtitle="Give freelancers guidance on the client profiles you want, and let them tag leads with it."
      userName={user.name ?? ""}
      role={user.role}
    >
      <div className="mb-4">
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to leads
        </Link>
      </div>
      <AdminRequirementsList profiles={profiles} freelancers={freelancers} />
    </Shell>
  );
}
