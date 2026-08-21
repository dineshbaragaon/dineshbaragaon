import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { leadIncludeFor } from "@/lib/lead-query";
import { validateLeadCore } from "@/lib/lead-validation";

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
    include: leadIncludeFor(role),
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
  const validated = validateLeadCore(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }
  const core = validated.data;
  const { requirementProfileId } = body;

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
      ...core,
      freelancerId: session.user.id,
      requirementProfileId: validRequirementProfileId,
      status: "NEW",
    },
    include: leadIncludeFor(session.user.role),
  });

  return NextResponse.json({ lead }, { status: 201 });
}
