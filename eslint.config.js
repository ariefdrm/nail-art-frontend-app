//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'
import checkFile from 'eslint-plugin-check-file'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'

// ---------------------------------------------------------------------------
// Design rules (DESIGN_SPEC.md sections 2, 4, 5): colors come from tokens only.
// They apply to className strings and to cn()/cva()/clsx() calls. The generated
// shadcn components in src/components/ui are exempt: they are restyled through
// the tokens in src/styles.css, not edited by hand.
// ---------------------------------------------------------------------------
const PALETTE =
  /\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|divide|decoration|accent|caret|placeholder|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)\b/
const ARBITRARY_COLOR = /-\[(?:#|oklch|oklab|rgb|rgba|hsl|hsla|color-mix)/
const DARK_VARIANT = /\bdark:/
const SHADOW = /\bshadow-(?:xs|sm|md|lg|xl|2xl|inner)\b/

/**
 * Selectors for a string used as a class: written directly in a className attribute, or anywhere inside
 * cn()/cva()/clsx(). The JSX selectors only match direct children, so a string inside cn() inside className
 * is reported once, not twice.
 */
const classStrings = (/** @type {RegExp} */ re) => [
  `JSXAttribute[name.name='className'] > Literal[value=/${re.source}/]`,
  `JSXAttribute[name.name='className'] > JSXExpressionContainer > Literal[value=/${re.source}/]`,
  `JSXAttribute[name.name='className'] > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/${re.source}/]`,
  `JSXAttribute[name.name='className'] ConditionalExpression > Literal[value=/${re.source}/]`,
  `CallExpression[callee.name=/^(?:cn|cva|clsx)$/] Literal[value=/${re.source}/]`,
  `CallExpression[callee.name=/^(?:cn|cva|clsx)$/] TemplateElement[value.raw=/${re.source}/]`,
]

const INNER_HTML = {
  selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
  message: 'dangerouslySetInnerHTML is not allowed: render API data as text.',
}

const restrictedSyntax = [
  ...classStrings(PALETTE).map((selector) => ({
    selector,
    message:
      'Use a design token class (bg-background, text-foreground, text-muted-foreground, border-border, bg-primary...). Palette colors are not allowed (DESIGN_SPEC.md section 2).',
  })),
  ...classStrings(ARBITRARY_COLOR).map((selector) => ({
    selector,
    message: 'Arbitrary colors are not allowed. Add or change a token in src/styles.css.',
  })),
  ...classStrings(DARK_VARIANT).map((selector) => ({
    selector,
    message: 'The design is light-only: do not use dark: variants (DESIGN_SPEC.md section 2.1).',
  })),
  ...classStrings(SHADOW).map((selector) => ({
    selector,
    message: 'The design uses 1px borders, not shadows (DESIGN_SPEC.md section 4).',
  })),
  INNER_HTML,
]

// ---------------------------------------------------------------------------
// Import rules (CODE_STYLE.md "Imports" and "Layers").
// no-restricted-imports does not merge between config blocks, so every block
// that sets it repeats the shared patterns.
// ---------------------------------------------------------------------------
const BASE_PATTERNS = [
  {
    group: ['#/*'],
    message: "Use the '@/' alias (src/*). The '#/' import map is not used in this project.",
  },
  {
    group: ['../*'],
    message:
      "Import across folders with the '@/' alias; only same-folder './' imports are relative.",
  },
]

/**
 * @param {string[]} layers areas this code may not import from, e.g. ['features', 'routes']
 * @param {boolean} [allowAxios] true only for the code that talks HTTP
 */
const restrictImports = (layers, allowAxios = false) => ({
  'no-restricted-imports': [
    'error',
    {
      ...(allowAxios
        ? {}
        : {
            paths: [
              {
                name: 'axios',
                message:
                  'Only src/lib/api and src/features/*/api.ts call the API. Use a hook from features/*/queries.ts.',
              },
            ],
          }),
      patterns: [
        ...BASE_PATTERNS,
        ...layers.map((layer) => ({
          group: [`@/${layer}`, `@/${layer}/*`],
          message: `This code must not import from ${layer}/ (routes -> features -> components -> lib).`,
        })),
      ],
    },
  ],
})

const SRC = 'src/**/*.{ts,tsx}'

export default [
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'dist/**',
      '.output/**',
      '.nitro/**',
      '.tanstack/**',
      'node_modules/**',
      'src/routeTree.gen.ts',
      'src/lib/api/schema.gen.ts',
    ],
  },

  ...tanstackConfig,
  ...pluginQuery.configs['flat/recommended'],
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,

  // Resolves the '@/' alias (tsconfig paths) so import/order and import/no-cycle see real files.
  {
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ project: './tsconfig.json' })],
    },
  },

  // --- Project-wide rules ----------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // The scaffold turned these off; they are what keeps files looking alike.
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
          pathGroups: [{ pattern: '@/**', group: 'internal', position: 'before' }],
          pathGroupsExcludedImportTypes: ['builtin', 'external', 'type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-cycle': 'error',
      'sort-imports': 'off',

      // Type safety that matters most for generated code.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',

      // General hygiene.
      'react-hooks/exhaustive-deps': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-restricted-syntax': ['error', ...restrictedSyntax],

      // pnpm-only rule from the TanStack preset; this repo uses Bun.
      'pnpm/json-enforce-catalog': 'off',
    },
  },

  // --- Application code only -------------------------------------------------
  {
    files: [SRC],
    rules: {
      // Named exports everywhere in src (route files export `Route` by name).
      'import/no-default-export': 'error',
      ...restrictImports([]),
    },
  },

  // --- Layers: routes -> features -> components -> lib -----------------------
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: restrictImports(['features', 'routes', 'layouts']),
  },
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: restrictImports(['features', 'components', 'routes', 'layouts']),
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: restrictImports(['routes', 'layouts']),
  },
  // The only code allowed to talk HTTP.
  {
    files: ['src/lib/api/**/*.ts'],
    rules: restrictImports(['features', 'components', 'routes', 'layouts'], true),
  },
  {
    files: ['src/features/**/api.ts'],
    rules: restrictImports(['routes', 'layouts'], true),
  },

  // --- File and folder names (routes are named by TanStack Router) -----------
  {
    files: ['src/{components,features,lib,hooks,layouts,utils}/**/*.{ts,tsx}'],
    plugins: { 'check-file': checkFile },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': [
        'error',
        { 'src/{components,features,lib,hooks,layouts,utils}/**/': 'KEBAB_CASE' },
      ],
    },
  },

  // --- Generated shadcn components: restyled through tokens ------------------
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', INNER_HTML],
    },
  },

  // --- Tests ----------------------------------------------------------------
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'no-restricted-syntax': 'off',
    },
  },
]
