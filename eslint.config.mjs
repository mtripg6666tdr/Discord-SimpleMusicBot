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
      "eqeqeq": "error",
      "max-nested-callbacks": [
        "warn",
        {
          "max": 4,
        },
      ],
      "new-cap": ["warn", {
          "capIsNew": false,
      }],
      "no-label-var": "error",
      "no-lone-blocks": "error",
      "no-lonely-if": "warn",
      "no-new-func": "error",
      "no-object-constructor": "error",
      "no-new-wrappers": "error",
      "no-octal-escape": "error",
      "no-self-compare": "warn",
      "no-sequences": "warn",
      "no-throw-literal": "warn",
      "no-undef-init": "warn",
      "no-unmodified-loop-condition": "error",
      "no-unneeded-ternary": "error",
      "no-unused-vars": "off",
      "no-useless-call": "warn",
      "no-useless-computed-key": "warn",
      "no-useless-concat": "warn",
      "no-useless-return": "warn",
      "no-var": "error",
      "no-void": "error",
      "operator-assignment": "warn",
      "prefer-arrow-callback": "warn",
      "prefer-const": "warn",
      "prefer-numeric-literals": "warn",
      "prefer-rest-params": "warn",
      "prefer-spread": "warn",
      "unicode-bom": "warn",
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
  },
  ...compat.extends("plugin:eslint-comments/recommended"),
  {
    rules: {
      "eslint-comments/no-unused-disable": "error",
    },
  },
];

const eslintConfigsBaseJavaScriptFiles = [
  {
    files: ["**/*.js"],
    rules: {
      "default-param-last": "error",
      "init-declarations": "warn",
      "no-array-constructor": "error",
      "no-implied-eval": "error",
      "no-invalid-this": "warn",
      "no-loop-func": "warn",
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
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          "disallowTypeAnnotations": false,
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
      "@typescript-eslint/no-confusing-non-null-assertion": "warn",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-deprecated": "warn",
      "@typescript-eslint/no-dupe-class-members": "error",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": [
        "error",
        {
          "ignoreParameters": true,
          "ignoreProperties": true,
        },
      ],
      "@typescript-eslint/no-invalid-this": "warn",
      "@typescript-eslint/no-loop-func": "warn",
      "@typescript-eslint/no-meaningless-void-operator": [
        "error",
        {
          "checkNever": false,
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-shadow": "error",
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
      "@typescript-eslint/prefer-enum-initializers": "warn",
      "@typescript-eslint/prefer-includes": "warn",
      "@typescript-eslint/prefer-readonly": [
        "warn",
        {
          "onlyInlineLambdas": false,
        },
      ],
      "@typescript-eslint/prefer-string-starts-ends-with": "warn",
      "@typescript-eslint/require-await": "off",

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
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_"
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
      "@stylistic/arrow-parens": ["warn", "as-needed"],
      "@stylistic/comma-dangle": [
        "warn",
        "always-multiline",
      ],
      "@stylistic/func-call-spacing": "warn",
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
      "@stylistic/max-statements-per-line": ["error"],
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
      "@stylistic/newline-per-chained-call": "warn",
      "@stylistic/no-extra-parens": [
        "warn",
        "all",
        {
          "nestedBinaryExpressions": false,
        },
      ],
      "@stylistic/no-extra-semi": "error",
      "@stylistic/nonblock-statement-body-position": "warn",
      "@stylistic/space-before-function-paren": [
        "warn",
        {
          "anonymous": "never",
          "asyncArrow": "always",
          "named": "never",
        },
      ],
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
      "license-header/header": ["warn", [
        "/*",
        ` * Copyright 2021-${new Date().getFullYear()} mtripg6666tdr`,
        " *",
        " * This file is part of mtripg6666tdr/Discord-SimpleMusicBot.",
        " * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )",
        " *",
        " * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it",
        " * under the terms of the GNU General Public License as published by the Free Software Foundation,",
        " * either version 3 of the License, or (at your option) any later version.",
        " *",
        " * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful,",
        " * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.",
        " * See the GNU General Public License for more details.",
        " *",
        " * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot.",
        " * If not, see <https://www.gnu.org/licenses/>.",
        " */",
      ]],
      "no-process-exit": "off",
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
