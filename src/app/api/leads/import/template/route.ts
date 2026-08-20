import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { toCsv } from "@/lib/csv";
import { IMPORT_COLUMNS } from "@/lib/lead-import";

export async function GET() {
  const session = await getSession();
  if (!session?.user || session.user.role !== "FREELANCER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const exampleRow = [
    "Website redesign for Acme Corp",
    "Jane Doe",
    "+1 555 0100",
    "jane@example.com",
    "",
    "United States",
    "California",
    "San Francisco",
    "Acme Co",
    "LinkedIn",
    "",
    "",
    "",
    "",
    "",
    "Wants to switch payment providers, budget ~$5k, prefers a call next week",
  ];

  const csv = toCsv(
    IMPORT_COLUMNS.map((c) => c.label),
    [exampleRow],
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leadflow-import-template.csv"`,
    },
  });
}
