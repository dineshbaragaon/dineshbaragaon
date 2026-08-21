import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/roles";
import { assignQualifierCore, assignSalesCore } from "@/lib/lead-assignment";
import { sendLeadsBulkAssignedEmail } from "@/lib/mailer";

const MAX_BULK = 500;
const CONCURRENCY = 8;

async function runInBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admin can perform bulk actions" }, { status: 403 });
  }

  const body = await req.json();
  const { leadIds, action } = body as { leadIds?: string[]; action?: string };

  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "No leads selected" }, { status: 400 });
  }
  if (leadIds.length > MAX_BULK) {
    return NextResponse.json({ error: `Too many leads selected — max ${MAX_BULK} at once` }, { status: 400 });
  }
  if (action !== "assign_qualifier" && action !== "assign_sales") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({ where: { id: { in: leadIds } } });
  const leadById = new Map(leads.map((l) => [l.id, l]));

  if (action === "assign_qualifier") {
    const qualifierId = typeof body.qualifierId === "string" ? body.qualifierId : "";
    if (!qualifierId) {
      return NextResponse.json({ error: "Invalid qualifier" }, { status: 400 });
    }
    const qualifier = await prisma.user.findUnique({ where: { id: qualifierId } });
    if (!qualifier || qualifier.role !== "QUALIFIER" || !qualifier.active) {
      return NextResponse.json({ error: "Invalid qualifier" }, { status: 400 });
    }

    const results = await runInBatches(leadIds, CONCURRENCY, async (leadId) => {
      const lead = leadById.get(leadId);
      if (!lead) return { leadId, ok: false, error: "Lead not found" };
      const result = await assignQualifierCore({ lead, qualifierId, qualifierName: qualifier.name, actorId: session.user.id });
      return result.ok ? { leadId, ok: true } : { leadId, ok: false, error: result.error };
    });

    const succeeded = results.filter((r) => r.ok).length;
    const failed = results.filter((r): r is { leadId: string; ok: false; error: string } => !r.ok);

    if (succeeded > 0) {
      await sendLeadsBulkAssignedEmail({
        to: qualifier.email,
        name: qualifier.name,
        count: succeeded,
        dashboardPath: ROLE_HOME.QUALIFIER,
      });
    }

    return NextResponse.json({ succeeded, failed });
  }

  const salesManagerId = typeof body.salesManagerId === "string" ? body.salesManagerId : "";
  if (!salesManagerId) {
    return NextResponse.json({ error: "Invalid sales manager" }, { status: 400 });
  }
  const salesManager = await prisma.user.findUnique({ where: { id: salesManagerId } });
  if (!salesManager || salesManager.role !== "SALES_MANAGER" || !salesManager.active) {
    return NextResponse.json({ error: "Invalid sales manager" }, { status: 400 });
  }

  const results = await runInBatches(leadIds, CONCURRENCY, async (leadId) => {
    const lead = leadById.get(leadId);
    if (!lead) return { leadId, ok: false, error: "Lead not found" };
    const result = await assignSalesCore({ lead, salesManagerId, salesManagerName: salesManager.name, actorId: session.user.id });
    return result.ok ? { leadId, ok: true } : { leadId, ok: false, error: result.error };
  });

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.filter((r): r is { leadId: string; ok: false; error: string } => !r.ok);

  if (succeeded > 0) {
    await sendLeadsBulkAssignedEmail({
      to: salesManager.email,
      name: salesManager.name,
      count: succeeded,
      dashboardPath: ROLE_HOME.SALES_MANAGER,
    });
  }

  return NextResponse.json({ succeeded, failed });
}
