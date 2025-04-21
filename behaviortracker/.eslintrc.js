// .eslintrc.js
module.exports = {
    root: true,
    extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
    rules: {
      // 👉 disable “no any” entirely
      "@typescript-eslint/no-explicit-any": "off",
      // 👉 unused‑vars only warn (or off)
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
    },
    overrides: [
      {
        // also disable in all your app/ files
        files: ["app/**/*.{ts,tsx}"],
        rules: {
          "@typescript-eslint/no-explicit-any": "off",
        },
      },
    ],
  };
  