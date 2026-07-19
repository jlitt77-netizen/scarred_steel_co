/**
 * Scarred Steel Co. logo lockup.
 *
 * The official mark is a square, distressed-steel stacked lockup supplied by the
 * owner (public/brand/logo-full.png). It has a transparent background, so it
 * sits directly on the dark UI. Do NOT recreate or regenerate the mark.
 *
 * Sizing is height-driven: `full` defaults to a compact header height and each
 * hero placement passes its own `h-*` class. `compact` is the small square badge
 * used in the collapsed sidebar. A caller-supplied `h-*` class overrides the
 * default so there's no Tailwind height conflict.
 */
export const LOGO_ASSETS_AVAILABLE = true;

const LOGO_SRC = "/brand/logo-full.png";

export function Logo({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "compact" | "mono";
  className?: string;
}) {
  const hasHeight = /(?:^|\s)h-/.test(className);
  const defaultHeight = hasHeight ? "" : variant === "compact" ? "h-9" : "h-10";

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={LOGO_SRC}
      alt="Scarred Steel Co."
      className={`w-auto object-contain ${defaultHeight} ${className}`.trim()}
    />
  );
}
