import Link from "next/link";
import { requireRole } from "@/lib/session";
import { Shell } from "@/components/Shell";
import { NewLeadForm } from "@/components/freelancer/NewLeadForm";

export default async function NewLeadPage() {
  const user = await requireRole("FREELANCER");

  return (
    <Shell title="Submit a new lead" userName={user.name ?? ""} role={user.role}>
      <div className="mb-4">
        <Link href="/freelancer" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to my leads
        </Link>
      </div>
      <NewLeadForm />
    </Shell>
  );
}
