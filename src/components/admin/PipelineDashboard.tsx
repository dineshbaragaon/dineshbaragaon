import type { PipelineStats } from "@/lib/pipeline-stats";
import { STATUS_COLOR } from "@/lib/lead-status";

function pct(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

export function PipelineDashboard({ stats }: { stats: PipelineStats }) {
  if (stats.total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No leads yet — numbers will show up here once freelancers start submitting.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total leads" value={stats.total} />
        <StatCard label="Open pipeline" value={stats.openPipeline} />
        <StatCard label="Deal agreed" value={stats.convertedCount} accent="text-emerald-700" />
        <StatCard label="Conversion rate" value={pct(stats.conversionRate)} accent="text-emerald-700" />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Pipeline funnel</h2>
        <FunnelBars stages={stats.funnel} />
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {stats.offPath.map((s) => (
            <span
              key={s.status}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[s.status]}`}
            >
              {s.label}: {s.count}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <TableHeader title="Sales manager pipeline" subtitle="Who's carrying how much right now, and how it's converting" />
        {stats.salesManagers.length === 0 ? (
          <EmptyRow text="No leads assigned to sales yet." />
        ) : (
          <Table
            columns={["Sales manager", "Active", "Deal agreed", "Closed", "Conversion"]}
            rows={stats.salesManagers.map((s) => [
              s.name,
              <BarCell key="active" value={s.active} max={maxOf(stats.salesManagers, "active")} />,
              s.converted,
              s.closed,
              pct(s.conversionRate),
            ])}
          />
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <TableHeader title="Qualifier throughput" subtitle="Who's reviewing how much, and the qualify vs. reject split" />
        {stats.qualifiers.length === 0 ? (
          <EmptyRow text="No leads assigned to qualifiers yet." />
        ) : (
          <Table
            columns={["Qualifier", "Reviewing now", "Qualified", "Rejected", "Total handled"]}
            rows={stats.qualifiers.map((q) => [
              q.name,
              <BarCell key="pending" value={q.pending} max={maxOf(stats.qualifiers, "pending")} />,
              q.qualified,
              q.rejected,
              q.total,
            ])}
          />
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <TableHeader title="Freelancer lead-gen performance" subtitle="Ranked by leads that actually got a deal agreed, not just volume submitted" />
        <Table
          columns={["Freelancer", "Submitted", "Qualified", "Deal agreed", "Conversion"]}
          rows={stats.freelancers.map((f) => [
            f.name,
            f.total,
            `${f.qualified} (${pct(f.qualificationRate)})`,
            <BarCell key="converted" value={f.converted} max={maxOf(stats.freelancers, "converted")} />,
            pct(f.conversionRate),
          ])}
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <TableHeader title="By requirement tag" subtitle="Which client profiles are actually converting" />
        {stats.tags.length === 0 ? (
          <EmptyRow text="No tagged leads yet." />
        ) : (
          <Table
            columns={["Tag", "Leads", "Deal agreed", "Conversion"]}
            rows={stats.tags.map((t) => [
              t.title,
              <BarCell key="total" value={t.total} max={maxOf(stats.tags, "total")} />,
              t.converted,
              pct(t.conversionRate),
            ])}
          />
        )}
        {stats.untaggedCount > 0 && (
          <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
            {stats.untaggedCount} lead{stats.untaggedCount === 1 ? "" : "s"} not tagged to any requirement.
          </p>
        )}
      </section>
    </div>
  );
}

function maxOf<T extends Record<string, unknown>>(rows: T[], key: keyof T): number {
  return Math.max(1, ...rows.map((r) => Number(r[key])));
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold text-slate-900 ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

function FunnelBars({ stages }: { stages: PipelineStats["funnel"] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="space-y-2.5">
      {stages.map((s) => (
        <div key={s.status} className="flex items-center gap-3">
          <span className="w-40 shrink-0 text-sm text-slate-600">{s.label}</span>
          <div className="h-2.5 flex-1 rounded-full bg-slate-100">
            <div
              className="h-2.5 rounded-full bg-slate-900"
              style={{ width: `${Math.max(2, (s.count / max) * 100)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-900">{s.count}</span>
        </div>
      ))}
    </div>
  );
}

function BarCell({ value, max }: { value: number; max: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-slate-900" style={{ width: `${Math.max(value > 0 ? 6 : 0, (value / max) * 100)}%` }} />
      </div>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function TableHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-slate-100 px-6 py-4">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="px-6 py-4 text-sm text-slate-400">{text}</p>;
}

function Table({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-slate-400">
            {columns.map((c) => (
              <th key={c} className="px-6 py-2 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`px-6 py-3 ${j === 0 ? "font-medium text-slate-900" : "text-slate-700"}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
