"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadWithRelations } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { CommentThread } from "@/components/CommentThread";

export function FreelancerLeadList({ leads }: { leads: LeadWithRelations[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        You haven&apos;t submitted any leads yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {leads.map((lead) => (
        <li key={lead.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setOpenId(openId === lead.id ? null : lead.id)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <div>
              <p className="font-medium text-slate-900">{lead.title}</p>
              <p className="text-sm text-slate-500">
                {lead.contactName}
                {lead.company ? ` · ${lead.company}` : ""}
              </p>
            </div>
            <StatusBadge status={lead.status} />
          </button>

          {openId === lead.id && (
            <div className="border-t border-slate-100 px-5 py-4">
              <LeadDetails lead={lead} />

              {lead.status === "NEEDS_REWORK" && <ReworkForm lead={lead} />}

              <div className="mt-4">
                <h4 className="mb-2 text-sm font-medium text-slate-700">Comments</h4>
                <CommentThread lead={lead} allowNewComment />
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function LeadDetails({ lead }: { lead: LeadWithRelations }) {
  return (
    <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
      <Detail label="Phone" value={lead.contactPhone} />
      <Detail label="Email" value={lead.contactEmail} />
      <Detail label="Source" value={lead.source} />
      <Detail label="Qualifier" value={lead.qualifier?.name} />
      <Detail label="Sales manager" value={lead.salesManager?.name} />
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
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}

function ReworkForm({ lead }: { lead: LeadWithRelations }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: lead.title,
    contactName: lead.contactName,
    contactPhone: lead.contactPhone ?? "",
    contactEmail: lead.contactEmail ?? "",
    company: lead.company ?? "",
    source: lead.source ?? "",
    details: lead.details,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function resubmit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resubmit", ...form }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to resubmit");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
      <p className="mb-3 text-sm font-medium text-orange-800">
        This lead needs rework. Update the details below and resubmit.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniField label="Title" value={form.title} onChange={(v) => update("title", v)} />
        <MiniField label="Contact name" value={form.contactName} onChange={(v) => update("contactName", v)} />
        <MiniField label="Phone" value={form.contactPhone} onChange={(v) => update("contactPhone", v)} />
        <MiniField label="Email" value={form.contactEmail} onChange={(v) => update("contactEmail", v)} />
        <MiniField label="Company" value={form.company} onChange={(v) => update("company", v)} />
        <MiniField label="Source" value={form.source} onChange={(v) => update("source", v)} />
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-sm font-medium text-slate-700">Details</label>
        <textarea
          rows={3}
          value={form.details}
          onChange={(e) => update("details", e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</label>
        <input
          value={form.comment}
          onChange={(e) => update("comment", e.target.value)}
          placeholder="What did you change?"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={resubmit}
        disabled={submitting}
        className="mt-3 rounded-lg bg-orange-700 px-4 py-2 text-sm font-medium text-white hover:bg-orange-800 disabled:opacity-50"
      >
        {submitting ? "Resubmitting…" : "Resubmit lead"}
      </button>
    </div>
  );
}

function MiniField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
      />
    </div>
  );
}
