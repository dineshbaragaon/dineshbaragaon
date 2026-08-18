import { prisma } from "@/lib/prisma";
import { SetPasswordForm } from "@/components/SetPasswordForm";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const valid =
    !!token &&
    !!(await prisma.user.findFirst({
      where: { passwordSetToken: token, passwordSetTokenExpires: { gt: new Date() } },
      select: { id: true },
    }));

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">LeadFlow</h1>
          <p className="mt-1 text-sm text-slate-500">Set your password</p>
        </div>

        {valid ? (
          <SetPasswordForm token={token!} />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-slate-700">
              This link is invalid or has expired.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Ask your admin to resend your invite from Manage users.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
