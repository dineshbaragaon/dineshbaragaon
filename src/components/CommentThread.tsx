"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadWithRelations } from "@/lib/types";
import { ROLE_LABEL } from "@/lib/roles";

export function CommentThread({
  lead,
  allowNewComment,
  canMarkInternal,
}: {
  lead: LeadWithRelations;
  allowNewComment: boolean;
  canMarkInternal?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/leads/${lead.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, internal: canMarkInternal ? internal : false }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to post comment");
      return;
    }
    setText("");
    setInternal(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {lead.comments.length === 0 && <p className="text-sm text-slate-400">No comments yet.</p>}
      <ul className="space-y-2">
        {lead.comments.map((c) => (
          <li
            key={c.id}
            className={`rounded-lg px-3 py-2 text-sm ${c.internal ? "bg-amber-50" : "bg-slate-50"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-slate-700">
                {c.author.name}{" "}
                <span className="font-normal text-slate-400">· {ROLE_LABEL[c.author.role]}</span>
                {c.internal && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Internal
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {new Date(c.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">{c.body}</p>
          </li>
        ))}
      </ul>

      {allowNewComment && (
        <div className="space-y-2 pt-1">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            <button
              onClick={submit}
              disabled={submitting || !text.trim()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Post
            </button>
          </div>
          {canMarkInternal && (
            <label className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300"
              />
              Internal note — hidden from the freelancer
            </label>
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
