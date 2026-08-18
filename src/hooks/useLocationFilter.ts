"use client";

import { useMemo, useState } from "react";

type Located = { country: string | null; state: string | null; city: string | null };

function distinctSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b));
}

export function useLocationFilter<T extends Located>(items: T[]) {
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  const countries = useMemo(() => distinctSorted(items.map((i) => i.country)), [items]);

  const states = useMemo(
    () => distinctSorted(items.filter((i) => !country || i.country === country).map((i) => i.state)),
    [items, country],
  );

  const cities = useMemo(
    () =>
      distinctSorted(
        items
          .filter((i) => (!country || i.country === country) && (!state || i.state === state))
          .map((i) => i.city),
      ),
    [items, country, state],
  );

  const filtered = useMemo(
    () =>
      items.filter(
        (i) => (!country || i.country === country) && (!state || i.state === state) && (!city || i.city === city),
      ),
    [items, country, state, city],
  );

  function selectCountry(value: string) {
    setCountry(value);
    setState("");
    setCity("");
  }

  function selectState(value: string) {
    setState(value);
    setCity("");
  }

  const active = Boolean(country || state || city);

  function clear() {
    setCountry("");
    setState("");
    setCity("");
  }

  return {
    country,
    state,
    city,
    countries,
    states,
    cities,
    filtered,
    active,
    selectCountry,
    selectState,
    selectCity: setCity,
    clear,
  };
}
