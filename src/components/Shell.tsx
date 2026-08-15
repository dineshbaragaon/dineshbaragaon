import { SignOutButton } from "@/components/SignOutButton";
import { ROLE_LABEL } from "@/lib/roles";
import type { Role } from "@prisma/client";

export function Shell({
  title,
  subtitle,
  userName,
  role,
  children,
}: {
  title: string;
  subtitle?: string;
  userName: string;
  role: Role;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">LeadFlow</p>
            <p className="text-xs text-slate-400">{ROLE_LABEL[role]} workspace</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{userName}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
