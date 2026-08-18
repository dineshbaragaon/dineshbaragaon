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
    details,
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
      details: details.trim(),
      freelancerId: session.user.id,
      status: "NEW",
    },
    include: leadInclude,
  });

  return NextResponse.json({ lead }, { status: 201 });
}
