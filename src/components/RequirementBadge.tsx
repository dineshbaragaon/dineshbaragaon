export function RequirementBadge({
  profile,
}: {
  profile?: { id: string; title: string } | null;
}) {
  if (!profile) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
      {profile.title}
    </span>
  );
}
