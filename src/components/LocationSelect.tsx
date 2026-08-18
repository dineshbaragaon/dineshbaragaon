"use client";

import { useEffect, useState } from "react";

type Option = { code: string; name: string };

export type LocationValue = {
  country: string;
  state: string;
  city: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-slate-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-400";

export function LocationSelect({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
}) {
  const [countries, setCountries] = useState<Option[]>([]);
  const [statesData, setStatesData] = useState<{ country: string; list: Option[] }>({ country: "", list: [] });
  const [citiesData, setCitiesData] = useState<{ key: string; list: string[] }>({ key: "", list: [] });

  // Load the full country list once.
  useEffect(() => {
    fetch("/api/locations/countries")
      .then((r) => r.json())
      .then((data) => setCountries(data.countries));
  }, []);

  // Everything below is derived from `value` + the fetched lists rather than mirrored into its
  // own state, so there's nothing to reset by hand when the selection changes upstream.
  const countryCode = countries.find((c) => c.name === value.country)?.code ?? "";
  const states = statesData.country === countryCode ? statesData.list : [];
  const stateCode = states.find((s) => s.name === value.state)?.code ?? "";
  const loadingStates = Boolean(countryCode) && statesData.country !== countryCode;

  const cityKey = countryCode ? `${countryCode}|${stateCode}` : "";
  const cities = citiesData.key === cityKey ? citiesData.list : [];
  const loadingCities = Boolean(cityKey) && citiesData.key !== cityKey && !(states.length > 0 && !stateCode);

  // Fetch states whenever the selected country changes.
  useEffect(() => {
    if (!countryCode) return;
    let cancelled = false;
    fetch(`/api/locations/states?country=${countryCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setStatesData({ country: countryCode, list: data.states });
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  // Fetch cities whenever country or state changes.
  useEffect(() => {
    if (!countryCode || !cityKey) return;
    if (states.length > 0 && !stateCode) return;
    let cancelled = false;
    const url = stateCode
      ? `/api/locations/cities?country=${countryCode}&state=${stateCode}`
      : `/api/locations/cities?country=${countryCode}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCitiesData({ key: cityKey, list: data.cities });
      });
    return () => {
      cancelled = true;
    };
  }, [countryCode, stateCode, states.length, cityKey]);

  function selectCountry(code: string) {
    const name = countries.find((c) => c.code === code)?.name ?? "";
    onChange({ country: name, state: "", city: "" });
  }

  function selectState(code: string) {
    const name = states.find((s) => s.code === code)?.name ?? "";
    onChange({ country: value.country, state: name, city: "" });
  }

  function selectCity(name: string) {
    onChange({ country: value.country, state: value.state, city: name });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Country</label>
        <select value={countryCode} onChange={(e) => selectCountry(e.target.value)} className={inputClass}>
          <option value="">Select country…</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">State</label>
        <select
          value={stateCode}
          onChange={(e) => selectState(e.target.value)}
          disabled={!countryCode || states.length === 0}
          className={inputClass}
        >
          <option value="">
            {!countryCode
              ? "Select country first"
              : loadingStates
                ? "Loading…"
                : states.length === 0
                  ? "N/A"
                  : "Select state…"}
          </option>
          {states.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
        <select
          value={value.city}
          onChange={(e) => selectCity(e.target.value)}
          disabled={!countryCode || (states.length > 0 && !stateCode)}
          className={inputClass}
        >
          <option value="">
            {!countryCode
              ? "Select country first"
              : states.length > 0 && !stateCode
                ? "Select state first"
                : loadingCities
                  ? "Loading…"
                  : "Select city…"}
          </option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
