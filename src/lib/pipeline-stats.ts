import type { LeadStatus } from "@prisma/client";
import { STATUS_LABEL } from "@/lib/lead-status";

type LeadForStats = {
  status: LeadStatus;
  freelancer: { id: string; name: string };
  qualifier: { id: string; name: string } | null;
  salesManager: { id: string; name: string } | null;
  requirementProfile: { id: string; title: string } | null;
};

const PASSED_QUALIFICATION: LeadStatus[] = [
  "QUALIFIED",
  "ASSIGNED_TO_SALES",
  "IN_PROGRESS",
  "CONVERTED",
  "CLOSED",
];

const FUNNEL_STAGES: LeadStatus[] = [
  "NEW",
  "IN_QUALIFICATION",
  "QUALIFIED",
  "ASSIGNED_TO_SALES",
  "IN_PROGRESS",
  "CONVERTED",
];

const OFF_PATH_STAGES: LeadStatus[] = ["NEEDS_REWORK", "REJECTED", "CLOSED"];

export type FunnelStage = { status: LeadStatus; label: string; count: number };

export type PersonStat = {
  id: string;
  name: string;
  total: number;
};

export type SalesManagerStat = PersonStat & {
  active: number;
  converted: number;
  closed: number;
  conversionRate: number;
};

export type QualifierStat = PersonStat & {
  pending: number;
  qualified: number;
  rejected: number;
};

export type FreelancerStat = PersonStat & {
  qualified: number;
  converted: number;
  qualificationRate: number;
  conversionRate: number;
};

export type TagStat = {
  id: string;
  title: string;
  total: number;
  converted: number;
  conversionRate: number;
};

export type PipelineStats = {
  total: number;
  openPipeline: number;
  convertedCount: number;
  conversionRate: number;
  funnel: FunnelStage[];
  offPath: FunnelStage[];
  salesManagers: SalesManagerStat[];
  qualifiers: QualifierStat[];
  freelancers: FreelancerStat[];
  tags: TagStat[];
  untaggedCount: number;
};

export function computePipelineStats(leads: LeadForStats[]): PipelineStats {
  const statusCounts = Object.fromEntries(
    Object.keys(STATUS_LABEL).map((s) => [s, 0]),
  ) as Record<LeadStatus, number>;
  for (const lead of leads) statusCounts[lead.status]++;

  const total = leads.length;
  const convertedCount = statusCounts.CONVERTED;
  const openPipeline = total - convertedCount - statusCounts.CLOSED - statusCounts.REJECTED;

  const funnel = FUNNEL_STAGES.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    count: statusCounts[status],
  }));
  const offPath = OFF_PATH_STAGES.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    count: statusCounts[status],
  }));

  const salesManagerMap = new Map<string, SalesManagerStat>();
  const qualifierMap = new Map<string, QualifierStat>();
  const freelancerMap = new Map<string, FreelancerStat>();
  const tagMap = new Map<string, TagStat>();
  let untaggedCount = 0;

  for (const lead of leads) {
    if (lead.salesManager) {
      const s =
        salesManagerMap.get(lead.salesManager.id) ??
        ({ id: lead.salesManager.id, name: lead.salesManager.name, total: 0, active: 0, converted: 0, closed: 0, conversionRate: 0 } satisfies SalesManagerStat);
      s.total++;
      if (lead.status === "ASSIGNED_TO_SALES" || lead.status === "IN_PROGRESS") s.active++;
      if (lead.status === "CONVERTED") s.converted++;
      if (lead.status === "CLOSED") s.closed++;
      salesManagerMap.set(lead.salesManager.id, s);
    }

    if (lead.qualifier) {
      const q =
        qualifierMap.get(lead.qualifier.id) ??
        ({ id: lead.qualifier.id, name: lead.qualifier.name, total: 0, pending: 0, qualified: 0, rejected: 0 } satisfies QualifierStat);
      q.total++;
      if (lead.status === "IN_QUALIFICATION") q.pending++;
      if (PASSED_QUALIFICATION.includes(lead.status)) q.qualified++;
      if (lead.status === "REJECTED") q.rejected++;
      qualifierMap.set(lead.qualifier.id, q);
    }

    const f =
      freelancerMap.get(lead.freelancer.id) ??
      ({ id: lead.freelancer.id, name: lead.freelancer.name, total: 0, qualified: 0, converted: 0, qualificationRate: 0, conversionRate: 0 } satisfies FreelancerStat);
    f.total++;
    if (PASSED_QUALIFICATION.includes(lead.status)) f.qualified++;
    if (lead.status === "CONVERTED") f.converted++;
    freelancerMap.set(lead.freelancer.id, f);

    if (lead.requirementProfile) {
      const t =
        tagMap.get(lead.requirementProfile.id) ??
        ({ id: lead.requirementProfile.id, title: lead.requirementProfile.title, total: 0, converted: 0, conversionRate: 0 } satisfies TagStat);
      t.total++;
      if (lead.status === "CONVERTED") t.converted++;
      tagMap.set(lead.requirementProfile.id, t);
    } else {
      untaggedCount++;
    }
  }

  const salesManagers = [...salesManagerMap.values()]
    .map((s) => ({ ...s, conversionRate: s.total > 0 ? s.converted / s.total : 0 }))
    .sort((a, b) => b.active - a.active || b.converted - a.converted);

  const qualifiers = [...qualifierMap.values()].sort((a, b) => b.pending - a.pending || b.total - a.total);

  const freelancers = [...freelancerMap.values()]
    .map((f) => ({
      ...f,
      qualificationRate: f.total > 0 ? f.qualified / f.total : 0,
      conversionRate: f.total > 0 ? f.converted / f.total : 0,
    }))
    .sort((a, b) => b.converted - a.converted || b.total - a.total);

  const tags = [...tagMap.values()]
    .map((t) => ({ ...t, conversionRate: t.total > 0 ? t.converted / t.total : 0 }))
    .sort((a, b) => b.total - a.total);

  return {
    total,
    openPipeline,
    convertedCount,
    conversionRate: total > 0 ? convertedCount / total : 0,
    funnel,
    offPath,
    salesManagers,
    qualifiers,
    freelancers,
    tags,
    untaggedCount,
  };
}
