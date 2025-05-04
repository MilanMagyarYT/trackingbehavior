/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./pages/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primaryBg: "#051427",        // color1 – deep navy
          accent: "#FF4618",           // color2 – bright orange
          card: "#0F1B2E",            // color3 – slightly lighter navy
          textPrimary: "#FFFFFF",
          textSecondary: "#A2A9B6",
        },
        fontFamily: {
          roboto: ["'Roboto Flex'", "sans-serif"],
        },
        letterSpacing: {
          tightest: "-0.04em",        // universal −4 % tracking
        },
        fontSize: {
          base: ["14px", { lineHeight: "20px" }],
          md:   ["18px", { lineHeight: "26px" }],
          title:["40px", { lineHeight: "48px" }],
        },
      },
    },
    plugins: [],
  };