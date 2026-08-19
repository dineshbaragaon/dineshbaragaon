import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { sendRequirementProfileEmail, sendRequirementProfileUpdatedEmail } from "@/lib/mailer";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const profile = await prisma.requirementProfile.findUnique({ where: { id } });
  if (!profile) {
    return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
  }

  if (typeof body.active === "boolean") {
    await prisma.requirementProfile.update({ where: { id }, data: { active: body.active } });
    return NextResponse.json({ ok: true });
  }

  if (typeof body.title === "string" || typeof body.description === "string") {
    const title = typeof body.title === "string" ? body.title.trim() : profile.title;
    const description = typeof body.description === "string" ? body.description.trim() : profile.description;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const updated = await prisma.requirementProfile.update({
      where: { id },
      data: { title, description },
    });

    const assignedFreelancers = await prisma.requirementAssignment.findMany({
      where: { profileId: id },
      select: { freelancer: { select: { name: true, email: true } } },
    });

    const emailResults = await Promise.all(
      assignedFreelancers.map((a) =>
        sendRequirementProfileUpdatedEmail({
          to: a.freelancer.email,
          name: a.freelancer.name,
          title: updated.title,
          description: updated.description,
        }),
      ),
    );
    const sentCount = emailResults.filter((r) => r.sent).length;

    return NextResponse.json({ ok: true, profile: updated, emailSummary: { sent: sentCount, total: assignedFreelancers.length } });
  }

  if (body.removeFreelancerId) {
    await prisma.requirementAssignment.deleteMany({
      where: { profileId: id, freelancerId: body.removeFreelancerId },
    });
    return NextResponse.json({ ok: true });
  }

  if (Array.isArray(body.addFreelancerIds) && body.addFreelancerIds.length > 0) {
    const existing = await prisma.requirementAssignment.findMany({
      where: { profileId: id },
      select: { freelancerId: true },
    });
    const existingIds = new Set(existing.map((a) => a.freelancerId));
    const newIds: string[] = body.addFreelancerIds.filter((fid: string) => !existingIds.has(fid));

    if (newIds.length === 0) {
      return NextResponse.json({ ok: true, emailSummary: { sent: 0, total: 0 } });
    }

    const freelancers = await prisma.user.findMany({
      where: { id: { in: newIds }, role: "FREELANCER", active: true },
      select: { id: true, name: true, email: true },
    });

    await prisma.requirementAssignment.createMany({
      data: freelancers.map((f) => ({ profileId: id, freelancerId: f.id })),
    });

    const emailResults = await Promise.all(
      freelancers.map((f) =>
        sendRequirementProfileEmail({ to: f.email, name: f.name, title: profile.title, description: profile.description }),
      ),
    );
    const sentCount = emailResults.filter((r) => r.sent).length;

    return NextResponse.json({ ok: true, emailSummary: { sent: sentCount, total: freelancers.length } });
  }

  return NextResponse.json({ error: "No valid action provided" }, { status: 400 });
}
