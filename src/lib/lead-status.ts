import { LeadStatus } from "@prisma/client";

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "New — awaiting assignment",
  IN_QUALIFICATION: "In qualification",
  NEEDS_REWORK: "Needs rework",
  REJECTED: "Rejected",
  QUALIFIED: "Qualified",
  ASSIGNED_TO_SALES: "Assigned to sales",
  IN_PROGRESS: "In progress",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

export const STATUS_COLOR: Record<LeadStatus, string> = {
  NEW: "bg-slate-100 text-slate-700",
  IN_QUALIFICATION: "bg-amber-100 text-amber-800",
  NEEDS_REWORK: "bg-orange-100 text-orange-800",
  REJECTED: "bg-red-100 text-red-700",
  QUALIFIED: "bg-emerald-100 text-emerald-800",
  ASSIGNED_TO_SALES: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  CONVERTED: "bg-green-100 text-green-800",
  CLOSED: "bg-slate-200 text-slate-600",
};
