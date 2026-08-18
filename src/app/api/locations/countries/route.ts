import { NextResponse } from "next/server";
import { Country } from "country-state-city";

export async function GET() {
  const countries = Country.getAllCountries()
    .map((c) => ({ code: c.isoCode, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ countries });
}
