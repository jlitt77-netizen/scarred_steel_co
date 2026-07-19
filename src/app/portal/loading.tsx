export default function Loading() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 h-48 animate-pulse rounded-lg border border-bg-gunmetal bg-bg-charcoal" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-md border border-bg-gunmetal bg-bg-charcoal" />
        ))}
      </div>
    </div>
  );
}
