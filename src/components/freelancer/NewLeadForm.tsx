"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Competitor, EngagementType } from "@prisma/client";
import { COMPETITOR_LABEL, ENGAGEMENT_LABEL } from "@/lib/lead-competitor";
import { LocationSelect } from "@/components/LocationSelect";

const EMPTY_FORM = {
  title: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  whatsappNumber: "",
  country: "",
  state: "",
  city: "",
  company: "",
  source: "",
  competitor: "" as Competitor | "",
  competitorOther: "",
  sourceUrl: "",
  engagementType: "" as EngagementType | "",
  details: "",
  requirementProfileId: "",
};

type ProfileOption = { id: string; title: string };

type FormState = typeof EMPTY_FORM;
type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim()) errors.title = "Lead title is required";
  if (!form.contactName.trim()) errors.contactName = "Contact name is required";
  if (!form.details.trim()) errors.details = "Details are required";
  if (!form.contactPhone.trim() && !form.contactEmail.trim() && !form.whatsappNumber.trim()) {
    errors.contactPhone = "Add at least one: phone, email, or WhatsApp number";
  }
  return errors;
}

export function NewLeadForm({ profiles }: { profiles: ProfileOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
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
    <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Lead title *"
          value={form.title}
          onChange={(v) => update("title", v)}
          placeholder="e.g. Website redesign for Acme Corp"
          error={errors.title}
          full
        />
        <Field
          label="Contact name *"
          value={form.contactName}
          onChange={(v) => update("contactName", v)}
          error={errors.contactName}
        />
        <div className="sm:col-span-2">
          <LocationSelect
            value={{ country: form.country, state: form.state, city: form.city }}
            onChange={(loc) => setForm((f) => ({ ...f, ...loc }))}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Contact phone number(s)
          </label>
          <textarea
            rows={2}
            value={form.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            placeholder="If there's more than one, add each on its own line or separate with a comma"
            className={`w-full rounded-lg border px-3 py-2.5 text-base outline-none focus:border-slate-500 sm:text-sm ${
              errors.contactPhone ? "border-red-400" : "border-slate-300"
            }`}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Contact email(s)</label>
          <textarea
            rows={2}
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            placeholder="If there's more than one, add each on its own line or separate with a comma"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-slate-500 sm:text-sm"
          />
        </div>

        {errors.contactPhone && (
          <p className="-mt-2 text-sm text-red-600 sm:col-span-2">{errors.contactPhone}</p>
        )}

        <Field
          label="WhatsApp number"
          value={form.whatsappNumber}
          onChange={(v) => update("whatsappNumber", v)}
          placeholder="A number you've confirmed is reachable on WhatsApp"
        />

        <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
        <Field
          label="Source"
          value={form.source}
          onChange={(v) => update("source", v)}
          placeholder="e.g. LinkedIn, referral"
        />
      </div>

      {profiles.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Requirement tag
          </label>
          <select
            value={form.requirementProfileId}
            onChange={(e) => update("requirementProfileId", e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-slate-500 sm:text-sm"
          >
            <option value="">No tag</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Tag this lead against a requirement your admin has assigned you, so it&apos;s classified correctly for everyone.
          </p>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-medium text-slate-700">
          Competitor content prospecting (optional)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Found on which competitor&apos;s LinkedIn content?
            </label>
            <select
              value={form.competitor}
              onChange={(e) => update("competitor", e.target.value as Competitor | "")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-slate-500 sm:text-sm"
            >
              <option value="">Not from competitor content</option>
              {(Object.keys(COMPETITOR_LABEL) as Competitor[]).map((c) => (
                <option key={c} value={c}>
                  {COMPETITOR_LABEL[c]}
                </option>
              ))}
            </select>
          </div>

          {form.competitor === "OTHER" && (
            <Field
              label="Which competitor?"
              value={form.competitorOther}
              onChange={(v) => update("competitorOther", v)}
              placeholder="e.g. Revolut"
            />
          )}

          {form.competitor && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">How did they engage?</label>
                <select
                  value={form.engagementType}
                  onChange={(e) => update("engagementType", e.target.value as EngagementType | "")}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-base outline-none focus:border-slate-500 sm:text-sm"
                >
                  <option value="">Select…</option>
                  {(Object.keys(ENGAGEMENT_LABEL) as EngagementType[]).map((e) => (
                    <option key={e} value={e}>
                      {ENGAGEMENT_LABEL[e]}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="LinkedIn post link"
                value={form.sourceUrl}
                onChange={(v) => update("sourceUrl", v)}
                placeholder="https://www.linkedin.com/posts/…"
                full
              />
            </>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Details *</label>
        <textarea
          rows={4}
          value={form.details}
          onChange={(e) => update("details", e.target.value)}
          placeholder="What does this lead need? Budget, timeline, background…"
          className={`w-full rounded-lg border px-3 py-2.5 text-base outline-none focus:border-slate-500 sm:text-sm ${
            errors.details ? "border-red-400" : "border-slate-300"
          }`}
        />
        {errors.details && <p className="mt-1 text-sm text-red-600">{errors.details}</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
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
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  full?: boolean;
  error?: string;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2.5 text-base outline-none focus:border-slate-500 sm:text-sm ${
          error ? "border-red-400" : "border-slate-300"
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
