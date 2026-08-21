import { prisma } from "@/lib/prisma";
import { canAssignQualifier, canAssignSales } from "@/lib/lead-status-rules";
import type { Lead } from "@prisma/client";

type CoreResult = { ok: true } | { ok: false; error: string };

/**
 * Updates the lead's qualifierId + comment log only — no include fetch, no email.
 * Used by both the single-lead PATCH route (which fetches + emails after) and the
 * bulk-assign route (which sends one summary email for the whole batch instead of
 * one per lead).
 */
export async function assignQualifierCore(params: {
  lead: Lead;
  qualifierId: string;
  qualifierName: string;
  actorId: string;
}): Promise<CoreResult> {
  const { lead, qualifierId, qualifierName, actorId } = params;
  if (!canAssignQualifier(lead)) {
    return { ok: false, error: "Lead is past the qualification stage" };
  }

  const previousQualifier =
    lead.qualifierId && lead.qualifierId !== qualifierId
      ? await prisma.user.findUnique({ where: { id: lead.qualifierId }, select: { name: true } })
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        qualifierId,
        ...(lead.status !== "NEEDS_REWORK" ? { status: "IN_QUALIFICATION" as const } : {}),
      },
    });
    await tx.comment.create({
      data: {
        leadId: lead.id,
        authorId: actorId,
        body: previousQualifier
          ? `Reassigned from ${previousQualifier.name} to ${qualifierName} for qualification.`
          : `Assigned to ${qualifierName} for qualification.`,
      },
    });
  });

  return { ok: true };
}

export async function assignSalesCore(params: {
  lead: Lead;
  salesManagerId: string;
  salesManagerName: string;
  actorId: string;
}): Promise<CoreResult> {
  const { lead, salesManagerId, salesManagerName, actorId } = params;
  if (!canAssignSales(lead)) {
    return { ok: false, error: "Lead must be qualified before assigning to sales" };
  }

  const previousSalesManager =
    lead.salesManagerId && lead.salesManagerId !== salesManagerId
      ? await prisma.user.findUnique({ where: { id: lead.salesManagerId }, select: { name: true } })
      : null;

  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: lead.id },
      data: {
        salesManagerId,
        ...(lead.status === "QUALIFIED" ? { status: "ASSIGNED_TO_SALES" as const } : {}),
      },
    });
    await tx.comment.create({
      data: {
        leadId: lead.id,
        authorId: actorId,
        body: previousSalesManager
          ? `Reassigned from ${previousSalesManager.name} to ${salesManagerName} for sales follow-up.`
          : `Assigned to ${salesManagerName} for sales follow-up.`,
      },
    });
  });

  return { ok: true };
}
