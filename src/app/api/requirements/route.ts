import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendRequirementProfileEmail } from "@/lib/mailer";

const profileInclude = {
  createdBy: { select: { name: true } },
  assignments: {
    include: { freelancer: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function GET() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const profiles = await prisma.requirementProfile.findMany({
    include: profileInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ profiles });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { title, description, freelancerIds } = await req.json();

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
  }

  if (!Array.isArray(freelancerIds) || freelancerIds.length === 0) {
    return NextResponse.json({ error: "Select at least one freelancer" }, { status: 400 });
  }

  const freelancers = await prisma.user.findMany({
    where: { id: { in: freelancerIds }, role: "FREELANCER", active: true },
    select: { id: true, name: true, email: true },
  });

  if (freelancers.length === 0) {
    return NextResponse.json({ error: "No valid freelancers selected" }, { status: 400 });
  }

  const profile = await prisma.requirementProfile.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      createdById: session.user.id,
      assignments: {
        create: freelancers.map((f) => ({ freelancerId: f.id })),
      },
    },
    include: profileInclude,
  });

  const emailResults = await Promise.all(
    freelancers.map((f) =>
      sendRequirementProfileEmail({
        to: f.email,
        name: f.name,
        title: profile.title,
        description: profile.description,
      }),
    ),
  );
  const sentCount = emailResults.filter((r) => r.sent).length;

  return NextResponse.json(
    { profile, emailSummary: { sent: sentCount, total: freelancers.length } },
    { status: 201 },
  );
}
