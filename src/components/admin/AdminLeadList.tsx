"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadWithRelations } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { CommentThread } from "@/components/CommentThread";
import { URGENCY_LABEL, URGENCY_COLOR } from "@/lib/lead-urgency";

type StaffOption = { id: string; name: string; email: string };

export function AdminLeadList({
  leads,
  qualifiers,
  salesManagers,
}: {
  leads: LeadWithRelations[];
  qualifiers: StaffOption[];
  salesManagers: StaffOption[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "NEW" | "QUALIFIED" | "ACTIVE">("ALL");

  const filtered = leads.filter((l) => {
    if (filter === "ALL") return true;
    if (filter === "NEW") return l.status === "NEW";
    if (filter === "QUALIFIED") return l.status === "QUALIFIED";
    if (filter === "ACTIVE") return l.status === "ASSIGNED_TO_SALES" || l.status === "IN_PROGRESS";
    return true;
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", "NEW", "QUALIFIED", "ACTIVE"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {f === "ALL" ? "All" : f === "NEW" ? "New" : f === "QUALIFIED" ? "Awaiting sales assignment" : "Active in sales"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No leads in this view.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((lead) => (
            <li key={lead.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                onClick={() => setOpenId(openId === lead.id ? null : lead.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <div>
                  <p className="font-medium text-slate-900">{lead.title}</p>
                  <p className="text-sm text-slate-500">
                    {lead.contactName}
                    {lead.company ? ` · ${lead.company}` : ""} · from {lead.freelancer.name}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusBadge status={lead.status} />
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_COLOR[lead.urgency]}`}>
                    {URGENCY_LABEL[lead.urgency]}
                  </span>
                </div>
              </button>

              {openId === lead.id && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <LeadDetails lead={lead} />

                  {lead.status === "NEW" && <AssignQualifier lead={lead} qualifiers={qualifiers} />}
                  {lead.status === "QUALIFIED" && <AssignSales lead={lead} salesManagers={salesManagers} />}

                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium text-slate-700">Comments</h4>
                    <CommentThread lead={lead} allowNewComment />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LeadDetails({ lead }: { lead: LeadWithRelations }) {
  return (
    <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
      <Detail label="Phone" value={lead.contactPhone} />
      <Detail label="Email" value={lead.contactEmail} />
      <Detail label="WhatsApp" value={lead.whatsappNumber} />
      <Detail label="City" value={lead.city} />
      <Detail label="Source" value={lead.source} />
      <Detail label="Freelancer" value={`${lead.freelancer.name} (${lead.freelancer.email})`} />
      <Detail label="Qualifier" value={lead.qualifier ? `${lead.qualifier.name} (${lead.qualifier.email})` : null} />
      <Detail
        label="Sales manager"
        value={lead.salesManager ? `${lead.salesManager.name} (${lead.salesManager.email})` : null}
      />
      <div className="col-span-full">
        <dt className="text-slate-400">Details</dt>
        <dd className="whitespace-pre-wrap text-slate-700">{lead.details}</dd>
      </div>
    </dl>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="whitespace-pre-wrap text-slate-700">{value}</dd>
    </div>
  );
}

function AssignQualifier({ lead, qualifiers }: { lead: LeadWithRelations; qualifiers: StaffOption[] }) {
  const router = useRouter();
  const [qualifierId, setQualifierId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assign() {
    if (!qualifierId) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign_qualifier", qualifierId }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to assign");
      return;
    }
    router.refresh();
  }

  if (qualifiers.length === 0) {
    return (
      <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        No qualifier accounts yet. Create one under Manage users.
      </p>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Assign to team member for qualification</label>
        <select
          value={qualifierId}
          onChange={(e) => setQualifierId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="">Select qualifier…</option>
          {qualifiers.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name} ({q.email})
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={assign}
        disabled={submitting || !qualifierId}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Assigning…" : "Assign"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}

function AssignSales({ lead, salesManagers }: { lead: LeadWithRelations; salesManagers: StaffOption[] }) {
  const router = useRouter();
  const [salesManagerId, setSalesManagerId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assign() {
    if (!salesManagerId) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "assign_sales", salesManagerId }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to assign");
      return;
    }
    router.refresh();
  }

  if (salesManagers.length === 0) {
    return (
      <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        No sales manager accounts yet. Create one under Manage users.
      </p>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Assign to sales manager</label>
        <select
          value={salesManagerId}
          onChange={(e) => setSalesManagerId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        >
          <option value="">Select sales manager…</option>
          {salesManagers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.email})
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={assign}
        disabled={submitting || !salesManagerId}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
      >
        {submitting ? "Assigning…" : "Assign"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
