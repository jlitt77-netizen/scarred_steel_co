// Minimal inline SVG icon set — no external icon dependency (CSP/offline safe).
// Stroke icons on a 24px grid; size via className (default 1em).
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p: IconProps) => (
  <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Base>
);
export const IconPlus = (p: IconProps) => (
  <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
);
export const IconBell = (p: IconProps) => (
  <Base {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Base>
);
export const IconAlert = (p: IconProps) => (
  <Base {...p}><path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></Base>
);
export const IconUser = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Base>
);
export const IconCalendar = (p: IconProps) => (
  <Base {...p}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></Base>
);
export const IconTruck = (p: IconProps) => (
  <Base {...p}><path d="M2 7h11v9H2zM13 10h5l3 3v3h-8z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></Base>
);
export const IconDollar = (p: IconProps) => (
  <Base {...p}><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Base>
);
export const IconChevron = (p: IconProps) => (
  <Base {...p}><path d="m9 6 6 6-6 6" /></Base>
);
export const IconCheck = (p: IconProps) => (
  <Base {...p}><path d="M20 6 9 17l-5-5" /></Base>
);
export const IconClock = (p: IconProps) => (
  <Base {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Base>
);
export const IconLayers = (p: IconProps) => (
  <Base {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></Base>
);
export const IconGauge = (p: IconProps) => (
  <Base {...p}><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M13.4 12.6 19 7" /><path d="M4 20a9 9 0 1 1 16 0" /></Base>
);
export const IconMenu = (p: IconProps) => (
  <Base {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Base>
);
export const IconPanelLeft = (p: IconProps) => (
  <Base {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></Base>
);
export const IconLogout = (p: IconProps) => (
  <Base {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></Base>
);
export const IconWrench = (p: IconProps) => (
  <Base {...p}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8 6.2 21l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.5-.4-.4-2.5 2.5-2.7Z" /></Base>
);
