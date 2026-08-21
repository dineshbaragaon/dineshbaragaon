import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { leadIncludeFor } from "@/lib/lead-query";
import { ROLE_HOME } from "@/lib/roles";
import { assignQualifierCore, assignSalesCore } from "@/lib/lead-assignment";
import { canAssignQualifier, canAssignSales } from "@/lib/lead-status-rules";
import {
  sendLeadAssignedEmail,
  sendLeadStatusUpdateEmail,
  sendLeadResubmittedEmail,
} from "@/lib/mailer";
import type { LeadStatus } from "@prisma/client";

async function loadLead(id: string) {
  return prisma.lead.findUnique({ where: { id } });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await loadLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = await req.json();
  const action = body.action as string;
  const user = session.user;

  switch (action) {
    case "assign_qualifier": {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Only admin can assign a qualifier" }, { status: 403 });
      }
      if (!canAssignQualifier(lead)) {
        return NextResponse.json({ error: "Lead is past the qualification stage" }, { status: 400 });
      }
      const { qualifierId } = body;
      const qualifier = await prisma.user.findUnique({ where: { id: qualifierId } });
      if (!qualifier || qualifier.role !== "QUALIFIER" || !qualifier.active) {
        return NextResponse.json({ error: "Invalid qualifier" }, { status: 400 });
      }
      const wasAssignedBefore = Boolean(lead.qualifierId && lead.qualifierId !== qualifierId);
      const result = await assignQualifierCore({
        lead,
        qualifierId,
        qualifierName: qualifier.name,
        actorId: user.id,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const updated = await prisma.lead.findUnique({ where: { id }, include: leadIncludeFor(user.role) });
      await sendLeadAssignedEmail({
        to: qualifier.email,
        name: qualifier.name,
        leadTitle: updated!.title,
        dashboardPath: ROLE_HOME.QUALIFIER,
        reassigned: wasAssignedBefore,
      });
      return NextResponse.json({ lead: updated });
    }

    case "assign_sales": {
      if (user.role !== "ADMIN") {
        return NextResponse.json({ error: "Only admin can assign a sales manager" }, { status: 403 });
      }
      if (!canAssignSales(lead)) {
        return NextResponse.json({ error: "Lead must be qualified before assigning to sales" }, { status: 400 });
      }
      const { salesManagerId } = body;
      const salesManager = await prisma.user.findUnique({ where: { id: salesManagerId } });
      if (!salesManager || salesManager.role !== "SALES_MANAGER" || !salesManager.active) {
        return NextResponse.json({ error: "Invalid sales manager" }, { status: 400 });
      }
      const wasAssignedBefore = Boolean(lead.salesManagerId && lead.salesManagerId !== salesManagerId);
      const result = await assignSalesCore({
        lead,
        salesManagerId,
        salesManagerName: salesManager.name,
        actorId: user.id,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      const updated = await prisma.lead.findUnique({ where: { id }, include: leadIncludeFor(user.role) });
      await sendLeadAssignedEmail({
        to: salesManager.email,
        name: salesManager.name,
        leadTitle: updated!.title,
        dashboardPath: ROLE_HOME.SALES_MANAGER,
        reassigned: wasAssignedBefore,
      });
      return NextResponse.json({ lead: updated });
    }

    case "qualify_decision": {
      if (user.role !== "QUALIFIER" || lead.qualifierId !== user.id) {
        return NextResponse.json({ error: "Not authorized for this lead" }, { status: 403 });
      }
      if (lead.status !== "IN_QUALIFICATION") {
        return NextResponse.json({ error: "Lead is not awaiting qualification" }, { status: 400 });
      }
      const { decision, comment } = body as { decision: LeadStatus; comment?: string };
      if (!["QUALIFIED", "REJECTED", "NEEDS_REWORK"].includes(decision)) {
        return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
      }
      if (decision !== "QUALIFIED" && !comment?.trim()) {
        return NextResponse.json(
          { error: "A comment is required when rejecting or requesting rework" },
          { status: 400 },
        );
      }

      const data =
        decision === "NEEDS_REWORK"
          ? { status: decision, preReworkStatus: "IN_QUALIFICATION" as LeadStatus }
          : { status: decision };

      const updated = await prisma.$transaction(async (tx) => {
        const updatedLead = await tx.lead.update({ where: { id }, data, include: leadIncludeFor(user.role) });
        if (comment?.trim()) {
          await tx.comment.create({ data: { leadId: id, authorId: user.id, body: comment.trim() } });
        } else {
          await tx.comment.create({
            data: { leadId: id, authorId: user.id, body: "Marked as qualified." },
          });
        }
        return updatedLead;
      });
      if (decision === "NEEDS_REWORK") {
        await sendLeadStatusUpdateEmail({
          to: updated.freelancer.email,
          name: updated.freelancer.name,
          heading: `Your lead needs rework: ${updated.title}`,
          message: `your lead "${updated.title}" needs some changes before it can move forward.\n\n"${comment!.trim()}"`,
        });
      } else if (decision === "REJECTED") {
        await sendLeadStatusUpdateEmail({
          to: updated.freelancer.email,
          name: updated.freelancer.name,
          heading: `Your lead was rejected: ${updated.title}`,
          message: `your lead "${updated.title}" was reviewed and rejected.\n\n"${comment!.trim()}"`,
        });
      } else {
        await sendLeadStatusUpdateEmail({
          to: updated.freelancer.email,
          name: updated.freelancer.name,
          heading: `Your lead was qualified: ${updated.title}`,
          message: `good news — your lead "${updated.title}" passed qualification and is moving to sales.`,
        });
      }
      return NextResponse.json({ lead: updated });
    }

    case "sales_update": {
      if (user.role !== "SALES_MANAGER" || lead.salesManagerId !== user.id) {
        return NextResponse.json({ error: "Not authorized for this lead" }, { status: 403 });
      }
      if (!["ASSIGNED_TO_SALES", "IN_PROGRESS"].includes(lead.status)) {
        return NextResponse.json({ error: "Lead is not currently with sales" }, { status: 400 });
      }
      const { status, comment } = body as { status: LeadStatus; comment?: string };
      if (!["IN_PROGRESS", "CONVERTED", "CLOSED", "NEEDS_REWORK"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      if (status === "NEEDS_REWORK" && !comment?.trim()) {
        return NextResponse.json(
          { error: "A comment is required when requesting rework" },
          { status: 400 },
        );
      }

      const data =
        status === "NEEDS_REWORK"
          ? { status, preReworkStatus: lead.status }
          : { status };

      const updated = await prisma.$transaction(async (tx) => {
        const updatedLead = await tx.lead.update({ where: { id }, data, include: leadIncludeFor(user.role) });
        if (comment?.trim()) {
          await tx.comment.create({ data: { leadId: id, authorId: user.id, body: comment.trim() } });
        }
        return updatedLead;
      });
      if (status === "NEEDS_REWORK") {
        await sendLeadStatusUpdateEmail({
          to: updated.freelancer.email,
          name: updated.freelancer.name,
          heading: `Your lead needs rework: ${updated.title}`,
          message: `your lead "${updated.title}" needs some changes before it can move forward.\n\n"${comment!.trim()}"`,
        });
      } else if (status === "CONVERTED") {
        await sendLeadStatusUpdateEmail({
          to: updated.freelancer.email,
          name: updated.freelancer.name,
          heading: `Deal agreed on your lead: ${updated.title}`,
          message: `great news — your lead "${updated.title}" reached Deal Agreed!`,
        });
      } else if (status === "CLOSED") {
        await sendLeadStatusUpdateEmail({
          to: updated.freelancer.email,
          name: updated.freelancer.name,
          heading: `Update on your lead: ${updated.title}`,
          message: `your lead "${updated.title}" was closed${comment?.trim() ? `: "${comment.trim()}"` : "."}`,
        });
      }
      return NextResponse.json({ lead: updated });
    }

    case "resubmit": {
      if (user.role !== "FREELANCER" || lead.freelancerId !== user.id) {
        return NextResponse.json({ error: "Not authorized for this lead" }, { status: 403 });
      }
      if (lead.status !== "NEEDS_REWORK") {
        return NextResponse.json({ error: "Lead is not marked for rework" }, { status: 400 });
      }
      const {
        title,
        contactName,
        contactPhone,
        contactEmail,
        whatsappNumber,
        country,
        state,
        city,
        company,
        source,
        details,
        comment,
        requirementProfileId,
      } = body;

      if (!contactPhone?.trim() && !contactEmail?.trim() && !whatsappNumber?.trim()) {
        return NextResponse.json(
          { error: "Add at least one way to reach this lead: phone, email, or WhatsApp" },
          { status: 400 },
        );
      }

      let validRequirementProfileId: string | null | undefined = undefined;
      if (requirementProfileId !== undefined) {
        if (requirementProfileId) {
          const assignment = await prisma.requirementAssignment.findFirst({
            where: {
              profileId: requirementProfileId,
              freelancerId: user.id,
              profile: { active: true },
            },
          });
          if (!assignment) {
            return NextResponse.json({ error: "Invalid requirement tag" }, { status: 400 });
          }
          validRequirementProfileId = requirementProfileId;
        } else {
          validRequirementProfileId = null;
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedLead = await tx.lead.update({
          where: { id },
          data: {
            ...(title?.trim() ? { title: title.trim() } : {}),
            ...(contactName?.trim() ? { contactName: contactName.trim() } : {}),
            contactPhone: contactPhone?.trim() || null,
            contactEmail: contactEmail?.trim() || null,
            whatsappNumber: whatsappNumber?.trim() || null,
            country: country?.trim() || null,
            state: state?.trim() || null,
            city: city?.trim() || null,
            company: company?.trim() || null,
            source: source?.trim() || null,
            ...(details?.trim() ? { details: details.trim() } : {}),
            ...(validRequirementProfileId !== undefined ? { requirementProfileId: validRequirementProfileId } : {}),
            status: lead.preReworkStatus ?? "NEW",
            preReworkStatus: null,
          },
          include: leadIncludeFor(user.role),
        });
        await tx.comment.create({
          data: {
            leadId: id,
            authorId: user.id,
            body: comment?.trim() ? `Resubmitted: ${comment.trim()}` : "Resubmitted after rework.",
          },
        });
        return updatedLead;
      });
      if (updated.status === "IN_QUALIFICATION" && updated.qualifier) {
        await sendLeadResubmittedEmail({
          to: updated.qualifier.email,
          name: updated.qualifier.name,
          leadTitle: updated.title,
          dashboardPath: ROLE_HOME.QUALIFIER,
        });
      } else if ((updated.status === "ASSIGNED_TO_SALES" || updated.status === "IN_PROGRESS") && updated.salesManager) {
        await sendLeadResubmittedEmail({
          to: updated.salesManager.email,
          name: updated.salesManager.name,
          leadTitle: updated.title,
          dashboardPath: ROLE_HOME.SALES_MANAGER,
        });
      }
      return NextResponse.json({ lead: updated });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
