import type { LeadStatus } from "@prisma/client";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/lead-status";

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
