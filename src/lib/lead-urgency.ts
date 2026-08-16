import type { LeadUrgency } from "@prisma/client";

export const URGENCY_LABEL: Record<LeadUrgency, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const URGENCY_COLOR: Record<LeadUrgency, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-red-100 text-red-700",
};
