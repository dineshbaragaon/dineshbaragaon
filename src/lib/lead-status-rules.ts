import type { LeadStatus } from "@prisma/client";

type LeadForRules = { status: LeadStatus; preReworkStatus: LeadStatus | null };

export function canAssignQualifier(lead: LeadForRules): boolean {
  return (
    lead.status === "NEW" ||
    lead.status === "IN_QUALIFICATION" ||
    (lead.status === "NEEDS_REWORK" && lead.preReworkStatus === "IN_QUALIFICATION")
  );
}

export function canAssignSales(lead: LeadForRules): boolean {
  return (
    lead.status === "QUALIFIED" ||
    lead.status === "ASSIGNED_TO_SALES" ||
    lead.status === "IN_PROGRESS" ||
    (lead.status === "NEEDS_REWORK" &&
      (lead.preReworkStatus === "ASSIGNED_TO_SALES" || lead.preReworkStatus === "IN_PROGRESS"))
  );
}

export function canSetDealMilestones(lead: { status: LeadStatus }): boolean {
  return lead.status === "CONVERTED";
}
