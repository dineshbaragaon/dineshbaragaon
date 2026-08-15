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
  const [form, setForm] = useState({ name: "", email: "", role: "FREELANCER" as Role, password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to create user");
      return;
    }

    setSuccess(`Created ${form.name} (${form.email}) as ${ROLE_LABEL[form.role]}. Share their login password with them.`);
    setForm({ name: "", email: "", role: "FREELANCER", password: "" });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Create an account</h2>
      <div className="grid gap-4 sm:grid-cols-2">
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
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Temporary password</label>
          <input
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="At least 6 characters"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}

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
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <h2 className="border-b border-slate-100 px-6 py-4 text-sm font-semibold text-slate-900">All accounts</h2>
      <ul className="divide-y divide-slate-100">
        {users.map((u) => (
          <UserRowItem key={u.id} user={u} />
        ))}
      </ul>
    </div>
  );
}

function UserRowItem({ user }: { user: UserRow }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        <div className="flex items-center gap-2">
          {!user.active && <span className="text-xs font-medium text-red-600">Deactivated</span>}
          <button
            onClick={() => setResetting((r) => !r)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            Reset password
          </button>
          <button
            onClick={toggleActive}
            disabled={busy}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            {user.active ? "Deactivate" : "Activate"}
          </button>
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
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  );
}
