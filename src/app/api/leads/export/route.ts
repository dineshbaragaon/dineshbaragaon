import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { STATUS_LABEL } from "@/lib/lead-status";
import { URGENCY_LABEL } from "@/lib/lead-urgency";
import { COMPETITOR_LABEL, ENGAGEMENT_LABEL } from "@/lib/lead-competitor";

function csvField(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const COLUMNS = [
  "Title",
  "Contact name",
  "Phone number(s)",
  "Email(s)",
  "WhatsApp",
  "Country",
  "State",
  "City",
  "Urgency",
  "Company",
  "Source",
  "Competitor content",
  "Engagement",
  "LinkedIn post",
  "Requirement tag",
  "Details",
  "Status",
  "Freelancer",
  "Freelancer email",
  "Qualifier",
  "Sales manager",
  "Submitted on",
  "Last updated",
];

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, role } = session.user;

  const where =
    role === "ADMIN"
      ? {}
      : role === "FREELANCER"
        ? { freelancerId: id }
        : role === "QUALIFIER"
          ? { qualifierId: id }
          : { salesManagerId: id };

  const leads = await prisma.lead.findMany({
    where,
    include: {
      freelancer: { select: { name: true, email: true } },
      qualifier: { select: { name: true } },
      salesManager: { select: { name: true } },
      requirementProfile: { select: { title: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows = leads.map((lead) =>
    [
      lead.title,
      lead.contactName,
      lead.contactPhone,
      lead.contactEmail,
      lead.whatsappNumber,
      lead.country,
      lead.state,
      lead.city,
      URGENCY_LABEL[lead.urgency],
      lead.company,
      lead.source,
      lead.competitor === "OTHER" ? lead.competitorOther : lead.competitor ? COMPETITOR_LABEL[lead.competitor] : "",
      lead.engagementType ? ENGAGEMENT_LABEL[lead.engagementType] : "",
      lead.sourceUrl,
      lead.requirementProfile?.title ?? "",
      lead.details,
      STATUS_LABEL[lead.status],
      lead.freelancer.name,
      lead.freelancer.email,
      lead.qualifier?.name ?? "",
      lead.salesManager?.name ?? "",
      lead.createdAt.toISOString(),
      lead.updatedAt.toISOString(),
    ]
      .map(csvField)
      .join(","),
  );

  const csv = "﻿" + [COLUMNS.join(","), ...rows].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${date}.csv"`,
    },
  });
}
