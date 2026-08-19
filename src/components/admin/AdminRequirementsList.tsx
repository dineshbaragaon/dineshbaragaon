"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FreelancerOption = { id: string; name: string; email: string };

type Profile = {
  id: string;
  title: string;
  description: string;
  active: boolean;
  createdAt: string | Date;
  createdBy: { name: string };
  assignments: { id: string; freelancer: FreelancerOption }[];
};

export function AdminRequirementsList({
  profiles,
  freelancers,
}: {
  profiles: Profile[];
  freelancers: FreelancerOption[];
}) {
  return (
    <div className="space-y-8">
      <CreateRequirementForm freelancers={freelancers} />
      <ProfileList profiles={profiles} freelancers={freelancers} />
    </div>
  );
}

function CreateRequirementForm({ freelancers }: { freelancers: FreelancerOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [freelancerIds, setFreelancerIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  function toggle(id: string) {
    setFreelancerIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, freelancerIds }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create requirement");
      return;
    }

    const { sent, total } = data.emailSummary ?? { sent: 0, total: 0 };
    setNotice({
      text:
        sent === total
          ? `Created "${title}" and notified ${sent} freelancer${sent === 1 ? "" : "s"} by email.`
          : `Created "${title}", but only ${sent} of ${total} notification emails could be sent.`,
      ok: sent === total,
    });
    setTitle("");
    setDescription("");
    setFreelancerIds([]);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">New requirement</h2>
      <p className="mb-4 text-xs text-slate-400">
        Describe the client profile you want freelancers to bring in. Give it a short tag name — that&apos;s what shows up on the lead form and everywhere the lead is visible.
      </p>
      <div className="grid gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Tag / short name</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Upwork Clients"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 sm:max-w-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description / guidance</label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Upwork freelancer agencies working in the global market, doing business or individual registrations"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Assign to</label>
          {freelancers.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              No freelancer accounts yet. Create one under Manage users.
            </p>
          ) : (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-3">
              {freelancers.map((f) => (
                <label key={f.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={freelancerIds.includes(f.id)}
                    onChange={() => toggle(f.id)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {f.name} <span className="text-slate-400">({f.email})</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {notice && <p className={`mt-3 text-sm ${notice.ok ? "text-emerald-700" : "text-amber-700"}`}>{notice.text}</p>}

      <button
        type="submit"
        disabled={submitting || freelancers.length === 0}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create requirement"}
      </button>
    </form>
  );
}

function ProfileList({ profiles, freelancers }: { profiles: Profile[]; freelancers: FreelancerOption[] }) {
  const [showArchived, setShowArchived] = useState(false);
  const archivedCount = profiles.filter((p) => !p.active).length;
  const visible = showArchived ? profiles : profiles.filter((p) => p.active);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">All requirements</h2>
        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived((s) => !s)}
            className="text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
          </button>
        )}
      </div>
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No requirements yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((p) => (
            <ProfileCard key={p.id} profile={p} freelancers={freelancers} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfileCard({ profile, freelancers }: { profile: Profile; freelancers: FreelancerOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [editDescription, setEditDescription] = useState(profile.description);
  const [editNotice, setEditNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const assignedIds = new Set(profile.assignments.map((a) => a.freelancer.id));
  const addable = freelancers.filter((f) => !assignedIds.has(f.id));

  async function toggleActive() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/requirements/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !profile.active }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Failed to update");
      return;
    }
    router.refresh();
  }

  async function removeFreelancer(freelancerId: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/requirements/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeFreelancerId: freelancerId }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Failed to remove");
      return;
    }
    router.refresh();
  }

  async function addFreelancer() {
    if (!addingId) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/requirements/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addFreelancerIds: [addingId] }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Failed to add");
      return;
    }
    setAddingId("");
    router.refresh();
  }

  async function saveEdit() {
    if (!editTitle.trim() || !editDescription.trim()) return;
    setBusy(true);
    setError(null);
    setEditNotice(null);
    const res = await fetch(`/api/requirements/${profile.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle.trim(), description: editDescription.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save changes");
      return;
    }
    const { sent, total } = data.emailSummary ?? { sent: 0, total: 0 };
    setEditNotice({
      text:
        total === 0
          ? "Saved. No freelancers assigned yet, so no notification was sent."
          : sent === total
            ? `Saved and notified ${sent} freelancer${sent === 1 ? "" : "s"} by email.`
            : `Saved, but only ${sent} of ${total} notification emails could be sent.`,
      ok: sent === total,
    });
    setEditing(false);
    router.refresh();
  }

  function cancelEdit() {
    setEditTitle(profile.title);
    setEditDescription(profile.description);
    setEditing(false);
  }

  return (
    <li className={`rounded-xl border bg-white p-5 shadow-sm ${profile.active ? "border-slate-200" : "border-slate-100 opacity-60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
              />
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={saveEdit}
                  disabled={busy || !editTitle.trim() || !editDescription.trim()}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={busy}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-slate-400">Assigned freelancers will get an email about this update when you save.</p>
            </div>
          ) : (
            <>
              <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-1 text-sm font-medium text-violet-700">
                {profile.title}
              </span>
              <p className="mt-2 text-sm text-slate-700">{profile.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                Created by {profile.createdBy.name} on{" "}
                {new Date(profile.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                {!profile.active && " · archived"}
              </p>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setEditing(true)}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={toggleActive}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              {profile.active ? "Archive" : "Unarchive"}
            </button>
          </div>
        )}
      </div>

      {editNotice && <p className={`mt-2 text-sm ${editNotice.ok ? "text-emerald-700" : "text-amber-700"}`}>{editNotice.text}</p>}

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-slate-500">Assigned freelancers</p>
        <div className="flex flex-wrap gap-2">
          {profile.assignments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
            >
              {a.freelancer.name}
              <button
                onClick={() => removeFreelancer(a.freelancer.id)}
                disabled={busy}
                className="text-slate-400 hover:text-red-600"
                aria-label={`Remove ${a.freelancer.name}`}
              >
                ×
              </button>
            </span>
          ))}
          {profile.assignments.length === 0 && <span className="text-xs text-slate-400">No one assigned</span>}
        </div>

        {addable.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <select
              value={addingId}
              onChange={(e) => setAddingId(e.target.value)}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-slate-500"
            >
              <option value="">Add freelancer…</option>
              {addable.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.email})
                </option>
              ))}
            </select>
            <button
              onClick={addFreelancer}
              disabled={busy || !addingId}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}
