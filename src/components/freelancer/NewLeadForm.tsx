"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewLeadForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    company: "",
    source: "",
    details: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to submit lead");
      return;
    }

    router.push("/freelancer");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lead title *" value={form.title} onChange={(v) => update("title", v)} placeholder="e.g. Website redesign for Acme Corp" full />
        <Field label="Contact name *" value={form.contactName} onChange={(v) => update("contactName", v)} />
        <Field label="Contact phone" value={form.contactPhone} onChange={(v) => update("contactPhone", v)} />
        <Field label="Contact email" value={form.contactEmail} onChange={(v) => update("contactEmail", v)} type="email" />
        <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
        <Field label="Source" value={form.source} onChange={(v) => update("source", v)} placeholder="e.g. LinkedIn, referral" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Details *</label>
        <textarea
          required
          rows={4}
          value={form.details}
          onChange={(e) => update("details", e.target.value)}
          placeholder="What does this lead need? Budget, timeline, background…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit lead"}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
      />
    </div>
  );
}
