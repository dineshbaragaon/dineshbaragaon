import type { Competitor } from "@prisma/client";
import { COMPETITOR_COLOR, COMPETITOR_LABEL } from "@/lib/lead-competitor";

export function CompetitorBadge({
  competitor,
  competitorOther,
}: {
  competitor: Competitor | null;
  competitorOther?: string | null;
}) {
  if (!competitor) return null;
  const label = competitor === "OTHER" && competitorOther ? competitorOther : COMPETITOR_LABEL[competitor];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${COMPETITOR_COLOR[competitor]}`}>
      {label} content
    </span>
  );
}
