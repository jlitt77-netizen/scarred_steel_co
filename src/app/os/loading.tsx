// Branded skeleton for CEO OS route transitions.
export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 h-10 w-64 animate-pulse rounded bg-bg-charcoal" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-md border border-bg-gunmetal bg-bg-charcoal" />
        ))}
      </div>
      <div className="mt-6 h-64 animate-pulse rounded-md border border-bg-gunmetal bg-bg-charcoal" />
    </div>
  );
}
