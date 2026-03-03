/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#7C3AED", light: "#A78BFA", dark: "#5B21B6" },
        accent: { DEFAULT: "#EC4899", light: "#F9A8D4" },
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
