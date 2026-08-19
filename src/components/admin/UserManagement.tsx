"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";
import { ROLE_LABEL } from "@/lib/roles";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  pending: boolean;
  createdAt: string | Date;
};

const CREATABLE_ROLES: Role[] = ["FREELANCER", "QUALIFIER", "SALES_MANAGER", "ADMIN"];

export function UserManagement({ users }: { users: UserRow[] }) {
  return (
    <div className="space-y-8">
      <CreateUserForm />
      <UserTable users={users} />
    </div>
  );
}

function CreateUserForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", role: "FREELANCER" as Role });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to create user");
      return;
    }

    if (data.emailResult?.sent) {
      setNotice({
        text: `Created ${form.name} (${form.email}) as ${ROLE_LABEL[form.role]}. An email was sent so they can set their own password.`,
        ok: true,
      });
    } else {
      setNotice({
        text: `Created ${form.name} (${form.email}) as ${ROLE_LABEL[form.role]}, but the invite email could not be sent (${data.emailResult?.error ?? "unknown error"}). Use "Resend invite" once email is configured.`,
        ok: false,
      });
    }
    setForm({ name: "", email: "", role: "FREELANCER" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Create an account</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Gmail / email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="name@gmail.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          >
            {CREATABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        No password needed here — they&apos;ll get an email with a link to set their own.
      </p>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {notice && <p className={`mt-3 text-sm ${notice.ok ? "text-emerald-700" : "text-amber-700"}`}>{notice.text}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

function UserTable({ users }: { users: UserRow[] }) {
  const [showArchived, setShowArchived] = useState(false);
  const archivedCount = users.filter((u) => !u.active).length;
  const visible = showArchived ? users : users.filter((u) => u.active);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-slate-900">All accounts</h2>
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
        <p className="px-6 py-4 text-sm text-slate-400">No accounts to show.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {visible.map((u) => (
            <UserRowItem key={u.id} user={u} />
          ))}
        </ul>
      )}
    </div>
  );
}

function UserRowItem({ user }: { user: UserRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function toggleActive() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Failed to update");
      return;
    }
    router.refresh();
  }

  async function deleteUser() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to delete");
      setConfirmingDelete(false);
      return;
    }
    router.refresh();
  }

  async function resendInvite() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resendInvite: true }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError("Failed to resend invite");
      return;
    }
    setNotice(data.emailResult?.sent ? "Invite email sent." : `Could not send email (${data.emailResult?.error ?? "unknown error"}).`);
  }

  async function resetPassword() {
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Failed to reset password");
      return;
    }
    setResetting(false);
    setNewPassword("");
    router.refresh();
  }

  return (
    <li className="px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">
            {user.name} <span className="ml-2 text-xs font-normal text-slate-400">{ROLE_LABEL[user.role]}</span>
          </p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!user.active && <span className="text-xs font-medium text-red-600">Archived</span>}
          {user.pending && <span className="text-xs font-medium text-amber-600">Invite pending</span>}
          {user.pending && (
            <button
              onClick={resendInvite}
              disabled={busy}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Resend invite
            </button>
          )}
          <button
            onClick={() => setResetting((r) => !r)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Set password directly
          </button>
          <button
            onClick={toggleActive}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            {user.active ? "Archive" : "Unarchive"}
          </button>
          {confirmingDelete ? (
            <>
              <span className="text-xs text-slate-500">Delete permanently?</span>
              <button
                onClick={deleteUser}
                disabled={busy}
                className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {resetting && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
          />
          <button
            onClick={resetPassword}
            disabled={busy}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      )}
      {notice && <p className="mt-2 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}
