import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { validateLeadCore, type ValidatedLeadCore } from "@/lib/lead-validation";
import { IMPORT_HEADER_MAP } from "@/lib/lead-import";

const MAX_ROWS = 500;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Only freelancers can import leads" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return NextResponse.json(
      { error: "Please upload a .csv file. In Excel: File → Save As → CSV (Comma delimited)." },
      { status: 400 },
    );
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: `Could not read the file: ${parsed.errors[0].message}` }, { status: 400 });
  }

  const recognizedHeader = (parsed.meta.fields ?? []).some((h) => IMPORT_HEADER_MAP[h]);
  if (!recognizedHeader) {
    return NextResponse.json(
      { error: "None of the columns match the expected template. Download the template and use its headers." },
      { status: 400 },
    );
  }

  const rows = parsed.data;
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows found in the file" }, { status: 400 });
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Too many rows — max ${MAX_ROWS} leads per import` }, { status: 400 });
  }

  const assignments = await prisma.requirementAssignment.findMany({
    where: { freelancerId: session.user.id, profile: { active: true } },
    select: { profile: { select: { id: true, title: true } } },
  });
  const tagByTitle = new Map(assignments.map((a) => [a.profile.title.trim().toLowerCase(), a.profile.id]));

  const toCreate: Array<
    ValidatedLeadCore & { freelancerId: string; requirementProfileId: string | null; status: "NEW" }
  > = [];
  const skipped: { row: number; reason: string }[] = [];

  rows.forEach((row, idx) => {
    const mapped: Record<string, string> = {};
    for (const [header, value] of Object.entries(row)) {
      const field = IMPORT_HEADER_MAP[header.trim().toLowerCase()];
      if (field) mapped[field] = value;
    }

    const requirementTagRaw = (mapped.requirementTag ?? "").trim();
    let requirementProfileId: string | null = null;
    if (requirementTagRaw) {
      const match = tagByTitle.get(requirementTagRaw.toLowerCase());
      if (!match) {
        skipped.push({ row: idx + 2, reason: `Unknown requirement tag "${requirementTagRaw}"` });
        return;
      }
      requirementProfileId = match;
    }

    const validated = validateLeadCore(mapped);
    if ("error" in validated) {
      skipped.push({ row: idx + 2, reason: validated.error });
      return;
    }

    toCreate.push({
      ...validated.data,
      freelancerId: session.user.id,
      requirementProfileId,
      status: "NEW",
    });
  });

  if (toCreate.length > 0) {
    await prisma.lead.createMany({ data: toCreate });
  }

  return NextResponse.json({ imported: toCreate.length, skipped, total: rows.length });
}
