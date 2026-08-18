import type { useLocationFilter } from "@/hooks/useLocationFilter";

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-50 disabled:text-slate-400";

export function LocationFilterBar({
  filter,
}: {
  filter: ReturnType<typeof useLocationFilter>;
}) {
  if (filter.countries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={filter.country} onChange={(e) => filter.selectCountry(e.target.value)} className={selectClass}>
        <option value="">All countries</option>
        {filter.countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={filter.state}
        onChange={(e) => filter.selectState(e.target.value)}
        disabled={filter.states.length === 0}
        className={selectClass}
      >
        <option value="">All states</option>
        {filter.states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filter.city}
        onChange={(e) => filter.selectCity(e.target.value)}
        disabled={filter.cities.length === 0}
        className={selectClass}
      >
        <option value="">All cities</option>
        {filter.cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {filter.active && (
        <button
          onClick={filter.clear}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}
