import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { leadInclude } from "@/lib/lead-query";

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
    include: leadInclude,
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Only freelancers can submit leads" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    contactName,
    contactPhone,
    contactEmail,
    whatsappNumber,
    country,
    state,
    city,
    urgency,
    company,
    source,
    competitor,
    competitorOther,
    sourceUrl,
    engagementType,
    details,
    requirementProfileId,
  } = body;

  if (!title?.trim() || !contactName?.trim() || !details?.trim()) {
    return NextResponse.json(
      { error: "Title, contact name, and details are required" },
      { status: 400 },
    );
  }

  if (!contactPhone?.trim() && !contactEmail?.trim() && !whatsappNumber?.trim()) {
    return NextResponse.json(
      { error: "Add at least one way to reach this lead: phone, email, or WhatsApp" },
      { status: 400 },
    );
  }

  if (urgency && !["LOW", "MEDIUM", "HIGH"].includes(urgency)) {
    return NextResponse.json({ error: "Invalid urgency" }, { status: 400 });
  }

  if (competitor && !["AIRWALLEX", "PAYONEER", "WISE", "WORLDFIRST", "OTHER"].includes(competitor)) {
    return NextResponse.json({ error: "Invalid competitor" }, { status: 400 });
  }

  if (engagementType && !["LIKED", "COMMENTED", "SHARED", "FOLLOWED", "OTHER"].includes(engagementType)) {
    return NextResponse.json({ error: "Invalid engagement type" }, { status: 400 });
  }

  let validRequirementProfileId: string | null = null;
  if (requirementProfileId) {
    const assignment = await prisma.requirementAssignment.findFirst({
      where: {
        profileId: requirementProfileId,
        freelancerId: session.user.id,
        profile: { active: true },
      },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Invalid requirement tag" }, { status: 400 });
    }
    validRequirementProfileId = requirementProfileId;
  }

  const lead = await prisma.lead.create({
    data: {
      title: title.trim(),
      contactName: contactName.trim(),
      contactPhone: contactPhone?.trim() || null,
      contactEmail: contactEmail?.trim() || null,
      whatsappNumber: whatsappNumber?.trim() || null,
      country: country?.trim() || null,
      state: state?.trim() || null,
      city: city?.trim() || null,
      urgency: urgency || "MEDIUM",
      company: company?.trim() || null,
      source: source?.trim() || null,
      competitor: competitor || null,
      competitorOther: competitor === "OTHER" ? competitorOther?.trim() || null : null,
      sourceUrl: sourceUrl?.trim() || null,
      engagementType: competitor ? engagementType || null : null,
      details: details.trim(),
      freelancerId: session.user.id,
      requirementProfileId: validRequirementProfileId,
      status: "NEW",
    },
    include: leadInclude,
  });

  return NextResponse.json({ lead }, { status: 201 });
}
