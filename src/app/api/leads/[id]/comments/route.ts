import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { leadInclude } from "@/lib/lead-query";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const user = session.user;
  const canComment =
    user.role === "ADMIN" ||
    lead.freelancerId === user.id ||
    lead.qualifierId === user.id ||
    lead.salesManagerId === user.id;

  if (!canComment) {
    return NextResponse.json({ error: "Not authorized for this lead" }, { status: 403 });
  }

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  await prisma.comment.create({
    data: { leadId: id, authorId: user.id, body: body.trim() },
  });

  const updated = await prisma.lead.findUnique({ where: { id }, include: leadInclude });
  return NextResponse.json({ lead: updated });
}
