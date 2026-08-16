"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadWithRelations } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { CommentThread } from "@/components/CommentThread";
import { URGENCY_LABEL, URGENCY_COLOR } from "@/lib/lead-urgency";

export function SalesLeadList({ leads }: { leads: LeadWithRelations[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No leads assigned to you right now.
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
                {lead.company ? ` · ${lead.company}` : ""} · sourced by {lead.freelancer.name}
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

              {(lead.status === "ASSIGNED_TO_SALES" || lead.status === "IN_PROGRESS") && (
                <UpdateForm lead={lead} />
              )}

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
      <Detail label="WhatsApp" value={lead.whatsappNumber} />
      <Detail label="City" value={lead.city} />
      <Detail label="Source" value={lead.source} />
      <Detail label="Freelancer" value={lead.freelancer.name} />
      <Detail label="Qualified by" value={lead.qualifier?.name} />
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

const ACTIONS = [
  { value: "IN_PROGRESS", label: "Mark in progress", commentRequired: false, style: "bg-indigo-700 hover:bg-indigo-800" },
  { value: "CONVERTED", label: "Mark converted", commentRequired: false, style: "bg-green-700 hover:bg-green-800" },
  { value: "CLOSED", label: "Close (lost)", commentRequired: false, style: "bg-slate-700 hover:bg-slate-800" },
  { value: "NEEDS_REWORK", label: "Send back to freelancer", commentRequired: true, style: "bg-orange-700 hover:bg-orange-800" },
] as const;

function UpdateForm({ lead }: { lead: LeadWithRelations }) {
  const router = useRouter();
  const [action, setAction] = useState<(typeof ACTIONS)[number]["value"] | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = ACTIONS.filter((a) => a.value !== lead.status);

  async function submit() {
    if (!action) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sales_update", status: action, comment }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to update status");
      return;
    }
    setAction(null);
    setComment("");
    router.refresh();
  }

  const activeAction = ACTIONS.find((a) => a.value === action);

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">Update status</p>
      <div className="flex flex-wrap gap-2">
        {available.map((a) => (
          <button
            key={a.value}
            onClick={() => setAction(a.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${a.style} ${
              action === a.value ? "ring-2 ring-offset-1 ring-slate-400" : "opacity-80"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {action && (
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Comment{activeAction?.commentRequired ? " (required)" : " (optional)"}
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              action === "NEEDS_REWORK"
                ? "Tell the freelancer what's missing or needs to change…"
                : "Optional note for the record"
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={submitting || (activeAction?.commentRequired && !comment.trim())}
            className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : `Confirm: ${activeAction?.label}`}
          </button>
        </div>
      )}
    </div>
  );
}
