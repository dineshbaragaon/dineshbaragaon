import { NextResponse } from "next/server";
import { City } from "country-state-city";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const countryCode = params.get("country");
  const stateCode = params.get("state");

  if (!countryCode) {
    return NextResponse.json({ error: "Missing country" }, { status: 400 });
  }

  const cities = stateCode
    ? City.getCitiesOfState(countryCode, stateCode)
    : City.getCitiesOfCountry(countryCode) ?? [];

  const names = Array.from(new Set(cities.map((c) => c.name))).sort((a, b) => a.localeCompare(b));

  return NextResponse.json({ cities: names });
}
