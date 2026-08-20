"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type ImportResult = {
  imported: number;
  total: number;
  skipped: { row: number; reason: string }[];
};

export function ImportLeadsForm({ tagTitles }: { tagTitles: string[] }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/leads/import", { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Import failed");
      return;
    }

    setResult(data);
    if (fileInput.current) fileInput.current.value = "";
    setFileName(null);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">1. Get the template</h2>
        <p className="mb-3 text-sm text-slate-600">
          Download the CSV template, fill in one row per lead in Excel or Google Sheets, then save/export as CSV.
        </p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page route; Link would try to soft-navigate it */}
        <a
          href="/api/leads/import/template"
          className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Download CSV template
        </a>

        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
          <p className="mb-1"><span className="font-medium text-slate-700">Required:</span> Title, Contact name, Details, and at least one of Phone number(s) / Email(s) / WhatsApp.</p>
          <p className="mb-1"><span className="font-medium text-slate-700">Competitor:</span> AIRWALLEX, PAYONEER, WISE, WORLDFIRST, or OTHER (optional).</p>
          {tagTitles.length > 0 ? (
            <p>
              <span className="font-medium text-slate-700">Requirement tag:</span> optional — type it exactly as shown to
              tag a lead: {tagTitles.map((t, i) => (
                <span key={t}>
                  {i > 0 && ", "}
                  <span className="font-medium text-violet-700">{t}</span>
                </span>
              ))}
            </p>
          ) : (
            <p><span className="font-medium text-slate-700">Requirement tag:</span> leave blank — you have no requirements assigned yet.</p>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">2. Upload your filled-in CSV</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Choose file
            <input
              ref={fileInput}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          {fileName && <span className="text-sm text-slate-600">{fileName}</span>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Importing…" : "Import leads"}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>

      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className={`text-sm font-medium ${result.imported > 0 ? "text-emerald-700" : "text-amber-700"}`}>
            Imported {result.imported} of {result.total} row{result.total === 1 ? "" : "s"}.
          </p>
          {result.imported > 0 && (
            <Link href="/freelancer" className="mt-2 inline-block text-sm text-slate-600 underline hover:text-slate-900">
              View my leads →
            </Link>
          )}

          {result.skipped.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                {result.skipped.length} row{result.skipped.length === 1 ? "" : "s"} skipped — fix and re-upload just these:
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500">
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.skipped.map((s) => (
                      <tr key={s.row}>
                        <td className="px-3 py-2 text-slate-500">{s.row}</td>
                        <td className="px-3 py-2 text-red-700">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
