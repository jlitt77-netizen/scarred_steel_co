import type { Config } from "tailwindcss";

/**
 * Scarred Steel Design System — centralized tokens (Sections 3–6, 24).
 *
 * Semantic names are the canonical API used by all components:
 *   - bg.*      surfaces (near-black → steel panel)
 *   - paper.*   text
 *   - rust/burnt/amber/brass/oxide/patina  brand accents
 *   - status.*  operational status (always paired with an icon/label)
 *   - cal.*     calendar categories (work/cash/content/revenue)
 *
 * `steel` and `rust` numeric ramps are kept as brand-accurate aliases so no
 * surface can render an off-brand color, and are being migrated to the
 * semantic names during the retrofit.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        bg: {
          nearblack: "#0A0A0A",
          coal: "#111111",
          charcoal: "#181818",
          gunmetal: "#232323",
          panel: "#2B2B2B",
        },
        // Text
        paper: {
          DEFAULT: "#F2EFE8",
          warm: "#F2EFE8",
          steel: "#D8D8D4",
          muted: "#999999",
        },
        // Brand accents
        rust: {
          DEFAULT: "#8B3A22",
          400: "#B85A2A",
          500: "#8B3A22",
          600: "#713124",
        },
        burnt: "#B85A2A",
        amber: "#C98532",
        brass: "#9A7138",
        oxide: "#713124",
        patina: {
          DEFAULT: "#365F66",
          light: "#4E848E",
        },
        // Operational status
        status: {
          healthy: "#5B7F58",
          attention: "#C98532",
          risk: "#B85A2A",
          critical: "#B23A2E",
          info: "#4E848E",
          inactive: "#6B6B6B",
          gain: "#5B7F58",
          loss: "#B24A3E",
        },
        // Calendar categories (Section 13)
        cal: {
          work: "#8A8F98",
          cash: "#B85A2A",
          content: "#4E848E",
          revenue: "#9A7138",
        },
        // Brand-accurate neutral ramp (compat alias, migrating to bg/paper)
        steel: {
          50: "#F2EFE8",
          100: "#D8D8D4",
          200: "#B8B8B4",
          300: "#999999",
          400: "#7C7C7C",
          500: "#5A5A5A",
          600: "#3C3C3C",
          700: "#2B2B2B",
          800: "#232323",
          900: "#161616",
          950: "#0A0A0A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Oswald", "Barlow Condensed", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        // Restrained, industrial — no pill/SaaS rounding on panels.
        sm: "3px",
        DEFAULT: "4px",
        md: "5px",
        lg: "6px",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.02) inset",
        raised: "0 4px 14px rgba(0,0,0,0.5)",
        drawer: "-8px 0 30px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        // Subtle brushed-steel / worn-shop texture for headers, login, empty
        // states and portal — never behind operational tables/charts (Section 5).
        "steel-grain":
          "repeating-linear-gradient(115deg, rgba(255,255,255,0.010) 0px, rgba(255,255,255,0.010) 1px, transparent 1px, transparent 4px), radial-gradient(120% 120% at 0% 0%, rgba(184,90,42,0.06) 0%, transparent 45%)",
        "panel-sheen":
          "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 40%)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.22s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
