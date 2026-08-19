"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadWithRelations } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { CompetitorBadge } from "@/components/CompetitorBadge";
import { RequirementBadge } from "@/components/RequirementBadge";
import { CommentThread } from "@/components/CommentThread";
import { URGENCY_LABEL, URGENCY_COLOR } from "@/lib/lead-urgency";
import { COMPETITOR_LABEL, ENGAGEMENT_LABEL } from "@/lib/lead-competitor";
import { useLocationFilter } from "@/hooks/useLocationFilter";
import { LocationFilterBar } from "@/components/LocationFilterBar";

export function QualifierLeadList({ leads }: { leads: LeadWithRelations[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const filter = useLocationFilter(leads);

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No leads assigned to you right now.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <LocationFilterBar filter={filter} />
      </div>

      {filter.filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No leads match this location filter.
        </div>
      ) : (
        <ul className="space-y-3">
          {filter.filtered.map((lead) => (
        <li key={lead.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setOpenId(openId === lead.id ? null : lead.id)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          >
            <div>
              <p className="font-medium text-slate-900">{lead.title}</p>
              <p className="text-sm text-slate-500">
                {lead.contactName}
                {lead.company ? ` · ${lead.company}` : ""} · submitted by {lead.freelancer.name}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge status={lead.status} />
              <div className="flex flex-wrap justify-end gap-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_COLOR[lead.urgency]}`}>
                  {URGENCY_LABEL[lead.urgency]}
                </span>
                <RequirementBadge profile={lead.requirementProfile} />
                <CompetitorBadge competitor={lead.competitor} competitorOther={lead.competitorOther} />
              </div>
            </div>
          </button>

          {openId === lead.id && (
            <div className="border-t border-slate-100 px-5 py-4">
              <LeadDetails lead={lead} />

              {lead.status === "IN_QUALIFICATION" && <DecisionForm lead={lead} />}

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
      <Detail label="Country" value={lead.country} />
      <Detail label="State" value={lead.state} />
      <Detail label="City" value={lead.city} />
      <Detail label="Source" value={lead.source} />
      <Detail
        label="Competitor content"
        value={lead.competitor === "OTHER" ? lead.competitorOther : lead.competitor ? COMPETITOR_LABEL[lead.competitor] : null}
      />
      <Detail label="Engagement" value={lead.engagementType ? ENGAGEMENT_LABEL[lead.engagementType] : null} />
      <Detail label="LinkedIn post" value={lead.sourceUrl} link />
      <Detail label="Requirement tag" value={lead.requirementProfile?.title} />
      <Detail label="Freelancer" value={lead.freelancer.name} />
      <Detail label="Freelancer email" value={lead.freelancer.email} />
      <div className="col-span-full">
        <dt className="text-slate-400">Details</dt>
        <dd className="whitespace-pre-wrap text-slate-700">{lead.details}</dd>
      </div>
    </dl>
  );
}

function Detail({ label, value, link }: { label: string; value?: string | null; link?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="whitespace-pre-wrap text-slate-700">
        {link ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline break-all">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

const DECISIONS = [
  { value: "QUALIFIED", label: "Qualify", commentRequired: false, style: "bg-emerald-700 hover:bg-emerald-800" },
  { value: "NEEDS_REWORK", label: "Request rework", commentRequired: true, style: "bg-orange-700 hover:bg-orange-800" },
  { value: "REJECTED", label: "Reject", commentRequired: true, style: "bg-red-700 hover:bg-red-800" },
] as const;

function DecisionForm({ lead }: { lead: LeadWithRelations }) {
  const router = useRouter();
  const [decision, setDecision] = useState<(typeof DECISIONS)[number]["value"] | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!decision) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "qualify_decision", decision, comment }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to submit decision");
      return;
    }
    setDecision(null);
    setComment("");
    router.refresh();
  }

  const activeDecision = DECISIONS.find((d) => d.value === decision);

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-medium text-slate-700">Qualification decision</p>
      <div className="flex flex-wrap gap-2">
        {DECISIONS.map((d) => (
          <button
            key={d.value}
            onClick={() => setDecision(d.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${d.style} ${
              decision === d.value ? "ring-2 ring-offset-1 ring-slate-400" : "opacity-80"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {decision && (
        <div className="mt-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Comment{activeDecision?.commentRequired ? " (required)" : " (optional)"}
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              decision === "NEEDS_REWORK"
                ? "Tell the freelancer what's missing or needs to change…"
                : decision === "REJECTED"
                  ? "Why is this lead being rejected?"
                  : "Optional note"
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={submitting || (activeDecision?.commentRequired && !comment.trim())}
            className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : `Confirm: ${activeDecision?.label}`}
          </button>
        </div>
      )}
    </div>
  );
}
