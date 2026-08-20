import type { Competitor, EngagementType, LeadUrgency } from "@prisma/client";

export const URGENCY_VALUES: LeadUrgency[] = ["LOW", "MEDIUM", "HIGH"];
export const COMPETITOR_VALUES: Competitor[] = ["AIRWALLEX", "PAYONEER", "WISE", "WORLDFIRST", "OTHER"];
export const ENGAGEMENT_VALUES: EngagementType[] = ["LIKED", "COMMENTED", "SHARED", "FOLLOWED", "OTHER"];

export type RawLeadInput = Record<string, unknown>;

export type ValidatedLeadCore = {
  title: string;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  whatsappNumber: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  urgency: LeadUrgency;
  company: string | null;
  source: string | null;
  competitor: Competitor | null;
  competitorOther: string | null;
  sourceUrl: string | null;
  engagementType: EngagementType | null;
  details: string;
};

function str(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

/**
 * Shared field-level validation used by both the single-lead submit form
 * and the bulk Excel/CSV import, so the two paths can never drift apart.
 * Does not touch the database — requirement-tag ownership is resolved by the caller.
 */
export function validateLeadCore(input: RawLeadInput): { data: ValidatedLeadCore } | { error: string } {
  const title = str(input.title);
  const contactName = str(input.contactName);
  const details = str(input.details);
  const contactPhone = str(input.contactPhone);
  const contactEmail = str(input.contactEmail);
  const whatsappNumber = str(input.whatsappNumber);

  if (!title || !contactName || !details) {
    return { error: "Title, contact name, and details are required" };
  }
  if (!contactPhone && !contactEmail && !whatsappNumber) {
    return { error: "Add at least one way to reach this lead: phone, email, or WhatsApp" };
  }

  const urgencyRaw = str(input.urgency).toUpperCase();
  if (urgencyRaw && !URGENCY_VALUES.includes(urgencyRaw as LeadUrgency)) {
    return { error: `Invalid urgency "${str(input.urgency)}" — use LOW, MEDIUM, or HIGH` };
  }

  const competitorRaw = str(input.competitor).toUpperCase();
  if (competitorRaw && !COMPETITOR_VALUES.includes(competitorRaw as Competitor)) {
    return { error: `Invalid competitor "${str(input.competitor)}"` };
  }

  const engagementRaw = str(input.engagementType).toUpperCase();
  if (engagementRaw && !ENGAGEMENT_VALUES.includes(engagementRaw as EngagementType)) {
    return { error: `Invalid engagement type "${str(input.engagementType)}"` };
  }

  const competitor = (competitorRaw || null) as Competitor | null;

  return {
    data: {
      title,
      contactName,
      contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      whatsappNumber: whatsappNumber || null,
      country: str(input.country) || null,
      state: str(input.state) || null,
      city: str(input.city) || null,
      urgency: (urgencyRaw || "MEDIUM") as LeadUrgency,
      company: str(input.company) || null,
      source: str(input.source) || null,
      competitor,
      competitorOther: competitor === "OTHER" ? str(input.competitorOther) || null : null,
      sourceUrl: str(input.sourceUrl) || null,
      engagementType: competitor ? ((engagementRaw || null) as EngagementType | null) : null,
      details,
    },
  };
}
