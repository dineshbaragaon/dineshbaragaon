export function MilestoneBadges({ registered, transactionLive }: { registered: boolean; transactionLive: boolean }) {
  if (!registered && !transactionLive) return null;
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {registered && (
        <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
          Registered
        </span>
      )}
      {transactionLive && (
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
          1st transaction live
        </span>
      )}
    </div>
  );
}
