export function ExportButton() {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not a page route; Link would try to soft-navigate it
    <a
      href="/api/leads/export"
      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
    >
      Export to Excel
    </a>
  );
}
