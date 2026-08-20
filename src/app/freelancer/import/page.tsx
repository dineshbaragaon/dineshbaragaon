import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Shell } from "@/components/Shell";
import { ImportLeadsForm } from "@/components/freelancer/ImportLeadsForm";

export default async function ImportLeadsPage() {
  const user = await requireRole("FREELANCER");

  const assignments = await prisma.requirementAssignment.findMany({
    where: { freelancerId: user.id, profile: { active: true } },
    select: { profile: { select: { title: true } } },
  });
  const tagTitles = assignments.map((a) => a.profile.title);

  return (
    <Shell
      title="Import leads from Excel"
      subtitle="Push many leads at once using a CSV file — download the template, fill it in, and upload it here."
      userName={user.name ?? ""}
      role={user.role}
    >
      <div className="mb-4">
        <Link href="/freelancer" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to my leads
        </Link>
      </div>
      <ImportLeadsForm tagTitles={tagTitles} />
    </Shell>
  );
}
