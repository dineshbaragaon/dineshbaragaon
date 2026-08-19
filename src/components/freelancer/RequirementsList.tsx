type Profile = { id: string; title: string; description: string; createdAt: Date };

export function RequirementsList({ profiles }: { profiles: Profile[] }) {
  if (profiles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No requirements assigned to you yet. Your admin will let you know what kind of leads to look for.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {profiles.map((p) => (
        <li key={p.id} className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-sm font-medium text-violet-700">
              {p.title}
            </span>
            <span className="text-xs text-slate-400">
              Added {new Date(p.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{p.description}</p>
        </li>
      ))}
    </ul>
  );
}
