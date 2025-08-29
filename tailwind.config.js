/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      boxShadow: { innerlg: "inset 0 2px 8px rgba(0,0,0,0.08)" }
    },
  },
  plugins: [],
}
