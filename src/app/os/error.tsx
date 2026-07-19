"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-display text-4xl uppercase text-status-critical">Something broke</p>
      <p className="mt-2 text-sm text-paper-muted">
        An unexpected error occurred loading this command center.
      </p>
      <button className="btn mt-6" onClick={reset}>Try again</button>
    </div>
  );
}
