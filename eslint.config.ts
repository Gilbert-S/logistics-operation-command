import { configs as eslintConfigs } from "@eslint/js"
import { defineConfig, globalIgnores, includeIgnoreFile } from "eslint/config"
import tseslint from "typescript-eslint"
import angular from "angular-eslint"
import stylistic from "@stylistic/eslint-plugin"
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss"
import angularTemplate from "@html-eslint/eslint-plugin-angular-template"
import { fileURLToPath } from "node:url"


const rootGitIgnore = fileURLToPath(new URL(".gitignore", import.meta.url))
const frontendGitIgnore = fileURLToPath(new URL("frontend/.gitignore", import.meta.url))
const backendGitIgnore = fileURLToPath(new URL("backend/.gitignore", import.meta.url))

export default defineConfig([

  globalIgnores([
    "frontend/libs/",
    "frontend/dist/",
    "frontend/src/app/leaflet-text-marker-canvas-plugin/index.js",
    "frontend/src/app/leaflet-canvas-markers-plugin/index.js",
    "backend/database/schema/auth-schema.ts",
    "common/dist/",
    "**/*.d.ts",
  ]),

  includeIgnoreFile(rootGitIgnore, { gitignoreResolution: true }),
  includeIgnoreFile(frontendGitIgnore, { gitignoreResolution: true }),
  includeIgnoreFile(backendGitIgnore, { gitignoreResolution: true }),


  {
    extends: [eslintPluginBetterTailwindcss.configs.recommended],
    files: ["**/*.html", "**/*.ts"],

    settings: { "better-tailwindcss": { entryPoint: "frontend/src/styles.scss" } },

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    plugins: { "@html-eslint/angular-template": angularTemplate },

    rules: {
      "better-tailwindcss/enforce-consistent-line-wrapping": [
        "warn", {
          group: "never",
          lineBreakStyle: "windows",
          preferSingleLine: true,
          printWidth: 100,
          strictness: "strict",
        },
      ],
      "better-tailwindcss/enforce-consistent-variant-order": "warn",
      "better-tailwindcss/enforce-shorthand-classes": "error",
      "better-tailwindcss/no-unknown-classes": ["warn", { ignore: ["dark"] }],

      "@html-eslint/angular-template/no-ineffective-attrs": "error",
      "@html-eslint/angular-template/no-invalid-attr-value": "error",
      "@html-eslint/angular-template/no-obsolete-attrs": "error",
      "@html-eslint/angular-template/no-obsolete-tags": "error",
    },
  },


  {
    files: ["**/*.ts"],

    extends: [
      eslintConfigs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],

    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "",
            "eslint.config.ts",
          ],
        },
      },
    },

    processor: angular.processInlineTemplates || "",
    rules: {

      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@angular-eslint/computed-must-return": "error",
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/no-uncalled-signals": "error",
      "@angular-eslint/prefer-signal-model": "warn",
      "@angular-eslint/prefer-signals": "error",
      "@angular-eslint/template/label-has-associated-control": "off",
      "@angular-eslint/use-component-view-encapsulation": "error",
      "@angular-eslint/use-lifecycle-interface": "warn",

      "arrow-body-style": "error",
      "block-scoped-var": "error",
      curly: ["error", "multi"],
      "default-param-last": "error",
      "grouped-accessor-pairs": ["error", "getBeforeSet"],
      "no-alert": "error",
      "no-await-in-loop": "error",
      "no-console": ["error", { allow: ["warn", "error", "debug"] }],
      "no-duplicate-imports": "error",
      "no-empty-function": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-inner-declarations": "error",
      "no-invalid-this": "error",
      "no-template-curly-in-string": "error",
      "no-unmodified-loop-condition": "error",
      "no-unneeded-ternary": "error",
      "no-useless-assignment": "error",
      "no-var": "error",
      "operator-assignment": ["warn", "always"],
      "prefer-const": "warn",
      "prefer-template": "error",
      "sort-keys": [
        "warn",
        "asc",
        {
          allowLineSeparatedGroups: true,
          caseSensitive: false,
          minKeys: 5,
          natural: true,
        },
      ],
    },
  },

  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      "@angular-eslint/no-input-rename": "off",
      "@angular-eslint/template/attributes-order": "warn",
      "@angular-eslint/template/label-has-associated-control": "off",
      "@angular-eslint/template/no-any": "error",
      "@angular-eslint/template/no-duplicate-attributes": "error",
      "@angular-eslint/template/no-empty-control-flow": "warn",
      "@angular-eslint/template/no-inline-styles": "error",
      "@angular-eslint/template/prefer-at-else": "warn",
      "@angular-eslint/template/prefer-at-empty": "warn",
      "@angular-eslint/template/prefer-built-in-pipes": "warn",
      "@angular-eslint/template/prefer-contextual-for-variables": "warn",
      "@angular-eslint/template/prefer-self-closing-tags": "warn",
      "@angular-eslint/template/prefer-static-string-properties": "warn",
      "@angular-eslint/template/prefer-template-literal": "error",
    },
  },




  {
    files: ["**/*.ts"],
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/array-bracket-newline": ["error", { multiline: true }],
      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/array-element-newline": ["error", "consistent"],
      "@stylistic/arrow-parens": ["error", "always"],
      "@stylistic/arrow-spacing": "error",
      "@stylistic/block-spacing": "error",
      "@stylistic/brace-style": ["error", "allman", { allowSingleLine: true }],
      "@stylistic/comma-dangle": ["error", "always-multiline"],
      "@stylistic/comma-spacing": [
        "error", {
          before: false,
          after: true,
        },
      ],
      "@stylistic/comma-style": ["error", "last"],
      "@stylistic/computed-property-spacing": "error",
      "@stylistic/dot-location": ["error", "property"],
      "@stylistic/eol-last": "off",
      "@stylistic/func-call-spacing": "off",
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/function-call-spacing": "error",
      "@stylistic/function-paren-newline": ["error", "multiline"],
      "@stylistic/generator-star-spacing": "off",
      "@stylistic/implicit-arrow-linebreak": "off",
      "@stylistic/indent": ["error", 2],
      "@stylistic/indent-binary-ops": "off",
      "@stylistic/jsx-child-element-spacing": "off",
      "@stylistic/jsx-closing-bracket-location": "off",
      "@stylistic/jsx-closing-tag-location": "off",
      "@stylistic/jsx-curly-brace-presence": "off",
      "@stylistic/jsx-curly-newline": "off",
      "@stylistic/jsx-curly-spacing": "off",
      "@stylistic/jsx-equals-spacing": "off",
      "@stylistic/jsx-first-prop-new-line": "off",
      "@stylistic/jsx-function-call-newline": "off",
      "@stylistic/jsx-indent": "off",
      "@stylistic/jsx-indent-props": "off",
      "@stylistic/jsx-max-props-per-line": "off",
      "@stylistic/jsx-newline": "off",
      "@stylistic/jsx-one-expression-per-line": "off",
      "@stylistic/jsx-pascal-case": "off",
      "@stylistic/jsx-props-no-multi-spaces": "off",
      "@stylistic/jsx-quotes": "off",
      "@stylistic/jsx-self-closing-comp": "off",
      "@stylistic/jsx-sort-props": "off",
      "@stylistic/jsx-tag-spacing": "off",
      "@stylistic/jsx-wrap-multilines": "off",
      "@stylistic/key-spacing": [
        "error",
        {
          beforeColon: false,
          afterColon: true,
        },
      ],
      "@stylistic/keyword-spacing": "error",
      "@stylistic/line-comment-position": "off",
      "@stylistic/linebreak-style": "off",
      "@stylistic/lines-around-comment": "off",
      "@stylistic/lines-between-class-members": [
        "error",
        {
          enforce:
          [
            {
              blankLine: "always",
              prev: "*",
              next: "method",
            }, {
              blankLine: "always",
              prev: "method",
              next: "*",
            },
          ],
        },
      ],
      "@stylistic/max-len": [
        "warn",
        {
          code: 100,
          comments: 100,
          ignoreTemplateLiterals: true,
          ignoreTrailingComments: true,
          ignoreUrls: true,
        },
      ],
      "@stylistic/max-statements-per-line": "off",
      "@stylistic/member-delimiter-style": "off",
      "@stylistic/multiline-comment-style": "off",
      "@stylistic/multiline-ternary": "off",
      "@stylistic/new-parens": "off",
      "@stylistic/newline-per-chained-call": "off",
      "@stylistic/no-confusing-arrow": "off",
      "@stylistic/no-extra-parens": "off",
      "@stylistic/no-extra-semi": "off",
      "@stylistic/no-floating-decimal": "off",
      "@stylistic/no-mixed-operators": "off",
      "@stylistic/no-mixed-spaces-and-tabs": "off",
      "@stylistic/no-multi-spaces": "error",
      "@stylistic/no-multiple-empty-lines": [
        "error",
        {
          max: 5,
          maxEOF: 0,
          maxBOF: 0,
        },
      ],
      "@stylistic/no-tabs": "off",
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/no-whitespace-before-property": "error",
      "@stylistic/nonblock-statement-body-position": "off",
      "@stylistic/object-curly-newline": ["error", { multiline: true }],
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/object-property-newline": [
        "error",
        { allowAllPropertiesOnSameLine: true },
      ],
      "@stylistic/one-var-declaration-per-line": "off",
      "@stylistic/operator-linebreak": "off",
      "@stylistic/padded-blocks": "off",
      "@stylistic/padding-line-between-statements": "off",
      "@stylistic/quote-props": ["error", "as-needed"],
      "@stylistic/quotes": [
        "error",
        "double",
        {
          avoidEscape: true,
          allowTemplateLiterals: "always",
        },
      ],
      "@stylistic/rest-spread-spacing": "off",
      "@stylistic/semi": ["error", "never"],
      "@stylistic/semi-spacing": "off",
      "@stylistic/semi-style": "off",
      "@stylistic/space-before-blocks": "off",
      "@stylistic/space-before-function-paren": "off",
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/space-infix-ops": "error",
      "@stylistic/space-unary-ops": "off",
      "@stylistic/spaced-comment": [
        "error",
        "always",
        { block: { balanced: true } },
      ],
      "@stylistic/switch-colon-spacing": "off",
      "@stylistic/template-curly-spacing": "off",
      "@stylistic/template-tag-spacing": "off",
      "@stylistic/type-annotation-spacing": "off",
      "@stylistic/type-generic-spacing": "off",
      "@stylistic/type-named-tuple-spacing": "off",
      "@stylistic/wrap-iife": "off",
      "@stylistic/wrap-regex": "off",
      "@stylistic/yield-star-spacing": "off",


    },
  },

])