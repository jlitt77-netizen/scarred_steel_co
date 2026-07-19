/**
 * Scarred Steel logo lockup.
 *
 * The official logo assets are supplied by the user (Section 7 — do NOT
 * recreate or generate the mark). Until the files are added, this renders a
 * TEMPORARY type wordmark so layouts are complete. To switch to the real
 * assets with zero layout changes:
 *   1. Drop `logo-full.svg`, `logo-compact.svg`, `logo-mono.svg` in public/brand/
 *   2. Set LOGO_ASSETS_AVAILABLE = true
 */
export const LOGO_ASSETS_AVAILABLE = false;

const ASSET: Record<string, { src: string; w: number; h: number }> = {
  full: { src: "/brand/logo-full.svg", w: 168, h: 40 },
  compact: { src: "/brand/logo-compact.svg", w: 40, h: 40 },
  mono: { src: "/brand/logo-mono.svg", w: 168, h: 40 },
};

export function Logo({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "compact" | "mono";
  className?: string;
}) {
  if (LOGO_ASSETS_AVAILABLE) {
    const a = ASSET[variant];
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={a.src} width={a.w} height={a.h} alt="Scarred Steel Co." className={className} />;
  }

  // Temporary wordmark placeholder (awaiting official assets).
  if (variant === "compact") {
    return (
      <span
        className={`inline-flex h-9 w-9 items-center justify-center rounded border border-bg-panel bg-bg-charcoal text-lg font-display tracking-widest text-rust-400 ${className}`}
        title="Scarred Steel Co. (logo placeholder)"
      >
        SS
      </span>
    );
  }
  return (
    <span
      className={`font-display text-xl uppercase leading-none tracking-[0.18em] ${className}`}
      title="Scarred Steel Co. (logo placeholder)"
    >
      Scarred <span className="text-rust-400">Steel</span> Co.
    </span>
  );
}
