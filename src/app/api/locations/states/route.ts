import { NextResponse } from "next/server";
import { State } from "country-state-city";

export async function GET(req: Request) {
  const countryCode = new URL(req.url).searchParams.get("country");
  if (!countryCode) {
    return NextResponse.json({ error: "Missing country" }, { status: 400 });
  }

  const states = State.getStatesOfCountry(countryCode)
    .map((s) => ({ code: s.isoCode, name: s.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ states });
}
