import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "no-console": "off",
      "prefer-const": "error",
      "no-var": "error",
      // Import sorting rules
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Node.js built-ins
            "external", // npm packages
            "internal", // Your own modules
            "parent", // ../
            "sibling", // ./
            "index", // ./index
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
