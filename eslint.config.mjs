import path from "path";
import { fileURLToPath } from "url";

import eslintJs from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import globals from "globals";

import eslintPluginLicenseHeader from "eslint-plugin-license-header";
import eslintPluginN from "eslint-plugin-n";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports";
import eslintPluginEslintComments from "eslint-plugin-eslint-comments";
import eslintPluginStylistic from "@stylistic/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslintJs.configs.recommended,
  allConfig: eslintJs.configs.all
});

const eslintConfigsBase = [
  eslintJs.configs.recommended,
  {
    rules: {
      "lines-between-class-members": "off",
      "no-empty-function": "off",
      "no-promise-executor-return": "off",
      "no-unused-vars": "off",

      "comma-style": "error",
      "dot-location": [
        "warn",
        "property",
      ],
      "eol-last": [
        "error",
        "always",
      ],
      "eqeqeq": "error",
      "func-call-spacing": "warn",
      "key-spacing": "error",
      "keyword-spacing": [
        "warn",
        {
          "after": false,
          "before": true,
          "overrides": {
            "case": {
              "after": true,
            },
            "const": {
              "after": true,
            },
            "do": {
              "after": false,
            },
            "else": {
              "before": false,
            },
            "export": {
              "after": true,
            },
            "from": {
              "after": true,
            },
            "import": {
              "after": true,
              "before": false,
            },
            "let": {
              "after": true,
            },
            "return": {
              "after": true,
            },
            "throw": {
              "after": true,
            },
          },
        },
      ],
      "max-nested-callbacks": [
        "warn",
        {
          "max": 4,
        },
      ],
      "max-statements-per-line": [
        "error",
      ],
      "new-cap": [
        "warn",
        {
          "capIsNew": false,
        },
      ],
      "newline-per-chained-call": "warn",
      "no-floating-decimal": "error",
      "no-label-var": "error",
      "no-lone-blocks": "error",
      "no-lonely-if": "warn",
      "no-mixed-requires": "error",
      "no-multi-spaces": "error",
      "no-multiple-empty-lines": [
        "warn",
        {
          "max": 2,
          "maxBOF": 0,
          "maxEOF": 1,
        },
      ],
      "no-new-func": "error",
      "no-new-object": "error",
      "no-new-require": "error",
      "no-new-wrappers": "error",
      "no-octal-escape": "error",
      "no-self-compare": "warn",
      "no-sequences": "warn",
      "no-throw-literal": "warn",
      "no-trailing-spaces": [
        "warn",
        {
          "ignoreComments": true,
          "skipBlankLines": true,
        },
      ],
      "no-undef-init": "warn",
      "no-unexpected-multiline": "warn",
      "no-unmodified-loop-condition": "error",
      "no-unneeded-ternary": "error",
      "no-unreachable": "warn",
      "no-useless-call": "warn",
      "no-useless-computed-key": "warn",
      "no-useless-concat": "warn",
      "no-useless-escape": "warn",
      "no-useless-return": "warn",
      "no-var": "error",
      "no-void": "error",
      "no-whitespace-before-property": "warn",
      "nonblock-statement-body-position": "warn",
      "operator-assignment": "warn",
      "operator-linebreak": [
        "warn",
        "before",
      ],
      "padded-blocks": [
        "warn",
        "never",
      ],
      "prefer-arrow-callback": "warn",
      "prefer-const": "warn",
      "prefer-numeric-literals": "warn",
      "prefer-rest-params": "warn",
      "prefer-spread": "warn",
      "rest-spread-spacing": "warn",
      "semi-spacing": "error",
      "space-before-blocks": [
        "warn",
        {
          "classes": "off",
          "functions": "off",
          "keywords": "never",
        },
      ],
      "space-before-function-paren": [
        "warn",
        {
          "anonymous": "never",
          "asyncArrow": "always",
          "named": "never",
        },
      ],
      "space-in-parens": "warn",
      "space-infix-ops": "warn",
      "space-unary-ops": "warn",
      "template-curly-spacing": "warn",
      "template-tag-spacing": "warn",
      "unicode-bom": "warn",
      "wrap-iife": "error",
      "yield-star-spacing": "error",
    },
  }
];

const eslintConfigsNode = [
  {
    plugins: {
      "n": eslintPluginN,
    },
    rules: {
      "n/no-path-concat": "warn",
      "n/no-unsupported-features/es-syntax": "off",
      "n/no-unpublished-import": "off",
      "n/no-unpublished-require": "off",
      "n/no-missing-import": "off",
      "n/no-missing-require": "off",
    },
  },
];

const eslintConfigsEslintComments = [
  {
    plugins: {
      "eslint-comments": eslintPluginEslintComments,
    },
    rules: {
      "eslint-comments/no-unused-disable": "error",
    },
  },
  ...compat.extends("plugin:eslint-comments/recommended"),
];

const eslintConfigsBaseJavaScriptFiles = [
  {
    files: ["**/*.js"],
    rules: {
      "default-param-last": "error",
      "init-declarations": "warn",
      "no-array-constructor": "error",
      "no-dupe-class-members": "error",
      "no-implied-eval": "error",
      "no-invalid-this": "warn",
      "no-loop-func": "warn",
      "no-loss-of-precision": "error",
      "no-return-await": "warn",
      "no-shadow": "error",
      "no-unused-expressions": [
        "warn",
        {
          "allowShortCircuit": true,
          "enforceForJSX": true,
        },
      ],
      "no-useless-constructor": "warn",
    }
  },
];

const eslintConfigsBaseTypescriptFiles = [
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      "import": eslintPluginImport,
      "unused-imports": eslintPluginUnusedImports,
    },
    rules: {
      "default-param-last": "off",
      "init-declarations": "off",
      "no-array-constructor": "off",
      "no-dupe-class-members": "off",
      "no-implied-eval": "off",
      "no-invalid-this": "off",
      "no-loop-func": "off",
      "no-loss-of-precision": "off",
      "no-return-await": "off",
      "no-shadow": "off",
      "no-throw-literal": "off",
      "no-unused-expressions": "off",
      "no-useless-constructor": "off",

      "@typescript-eslint/array-type": [
        "error",
        {
          "default": "array",
        },
      ],
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          "prefer": "type-imports",
        },
      ],
      "@typescript-eslint/default-param-last": "error",
      "@typescript-eslint/init-declarations": "warn",
      "@typescript-eslint/lines-between-class-members": "off",
      "@typescript-eslint/method-signature-style": [
        "error",
        "property",
      ],
      "@typescript-eslint/no-array-constructor": "error",
      "@typescript-eslint/no-confusing-non-null-assertion": "warn",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-deprecated": "warn",
      "@typescript-eslint/no-dupe-class-members": "error",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-interface": [
        "error",
        {
          "allowSingleExtends": false,
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-implied-eval": "error",
      "@typescript-eslint/no-inferrable-types": [
        "error",
        {
          "ignoreParameters": true,
          "ignoreProperties": true,
        },
      ],
      "@typescript-eslint/no-invalid-this": "warn",
      "@typescript-eslint/no-loop-func": "warn",
      "@typescript-eslint/no-loss-of-precision": "error",
      "@typescript-eslint/no-meaningless-void-operator": [
        "error",
        {
          "checkNever": false,
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        {
          "allowShortCircuit": true,
          "enforceForJSX": true,
        },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-useless-constructor": "warn",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/only-throw-error": "warn",
      "@typescript-eslint/prefer-as-const": "warn",
      "@typescript-eslint/prefer-enum-initializers": "warn",
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/prefer-includes": "warn",
      "@typescript-eslint/prefer-readonly": [
        "warn",
        {
          "onlyInlineLambdas": false,
        },
      ],
      "@typescript-eslint/prefer-string-starts-ends-with": "warn",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/return-await": [
        "warn",
        "in-try-catch",
      ],

      "import/order": [1, {
        "groups": [
          "type",
          "builtin",
          "external",
          [
            "parent",
            "sibling",
            "index",
          ],
          "object",
        ],
        "pathGroups": [
        ],
        "pathGroupsExcludedImportTypes": ["builtin", "type"],
        "alphabetize": {
          "order": "asc",
        },
        "newlines-between": "always",
      }],
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          "vars": "all",
          "varsIgnorePattern": "^_",
          "args": "after-used",
          "argsIgnorePattern": "^_",
        },
      ],
    },
  },
];

const eslintConfigsStylistic = [
  eslintPluginStylistic.configs.customize({
    braceStyle: "1tbs",
    indent: 2,
    quotes: "double",
    semi: true,
  }),
  {
    plugins: {
      "@stylistic": eslintPluginStylistic,
    },
    rules: {
      "@stylistic/comma-dangle": [
        "warn",
        "always-multiline",
      ],
      "@stylistic/indent": [
        "warn",
        2,
        {
          "SwitchCase": 1,
          "ignoredNodes": [
            "PropertyDefinition[decorators]",
            "TSUnionType",
          ],
        },
      ],
      "@stylistic/member-delimiter-style": [
        "error",
        {
          "multiline": {
            "delimiter": "comma",
            "requireLast": true,
          },
          "overrides": {
            "interface": {
              "multiline": {
                "delimiter": "semi",
                "requireLast": true,
              },
            },
          },
          "singleline": {
            "delimiter": "comma",
            "requireLast": false,
          },
        },
      ],
      "@stylistic/no-extra-parens": [
        "warn",
        "all",
        {
          "nestedBinaryExpressions": false,
        },
      ],
      "@stylistic/no-extra-semi": "error",
      "@stylistic/type-annotation-spacing": "warn",
    },
  }
];

const config = tseslint.config(
  {
    ignores: [
      "util/*",
      "!util/exampleDbServer",
      "util/exampleDbServer/*",
      "!util/exampleDbServer/node",
      "util/exampleDbServer/node/dist",
      "!src/Util",
      "test/*",
      "lib/*",
      "dist/*",
      "**/docs",
      "**/*.temp.*",
      "**/*.tmp.*",
      "**/*.mjs",
      "**/_index.ts",
    ],
  },
  ...eslintConfigsBase,
  ...tseslint.configs.recommended,
  ...eslintConfigsNode,
  ...eslintConfigsEslintComments,
  ...eslintConfigsBaseJavaScriptFiles,
  ...eslintConfigsBaseTypescriptFiles,
  ...eslintConfigsStylistic,
  {
    files: ["**/*.ts"],
    plugins: {
      "license-header": eslintPluginLicenseHeader,
    },

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      "license-header/header": ["warn", "./util/license.js"],
      "no-process-exit": "off",
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    files: ["util/exampleDbServer/node/src/**/*.ts"],

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: path.join(__dirname, "util/exampleDbServer/node"),
      },
    },
  },
);

export default config;
