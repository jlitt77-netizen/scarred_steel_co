import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        steel: {
          50: "#f5f6f7",
          100: "#e6e8eb",
          200: "#c9ced4",
          300: "#a3abb5",
          400: "#78828f",
          500: "#586170",
          600: "#454d59",
          700: "#383e48",
          800: "#22262d",
          900: "#15181d",
          950: "#0c0e11",
        },
        rust: {
          400: "#c76b43",
          500: "#b4552f",
          600: "#973f22",
        },
      },
    },
  },
  plugins: [],
};

export default config;
