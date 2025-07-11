module.exports = {
    root: true,
    extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
    },
    overrides: [
      {
        files: ["app/**/*.{ts,tsx}"],
        rules: {
          "@typescript-eslint/no-explicit-any": "off",
        },
      },
    ],
  };
  