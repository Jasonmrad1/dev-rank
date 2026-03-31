import js from "@eslint/js";
import globals from "globals";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  {
    files: ["**/*.{js,mjs,cjs}"],

    languageOptions: {
      globals: globals.browser
    },

    plugins: {
      "unused-imports": unusedImports
    },

    ...js.configs.recommended,

    rules: {
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": "warn"
    }
  },

  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs"
    }
  }
];