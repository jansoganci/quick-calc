import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import importX from 'eslint-plugin-import-x'

export default tseslint.config(
  { ignores: ['node_modules/**', 'docs/**', 'dist/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'import-x': importX },
    settings: {
      // imports carry explicit .ts/.tsx extensions in this project
      'import-x/resolver-next': [importX.createNodeResolver({ extensions: ['.ts', '.tsx'] })],
    },
    rules: {
      'import-x/no-cycle': 'error',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // Pinned to the two classic hook rules. The plugin's own `recommended`
      // preset additionally enables the React Compiler rule set, which is a
      // separate decision and not part of this dependency upgrade.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Quick and Detailed are separate business engines and must never import each
    // other's logic (architecture R5). This uses `no-restricted-paths` rather than
    // extending the `no-restricted-imports` block below, because a second flat-config
    // block would REPLACE that rule for the matched files and silently drop the
    // React/features/components/data restrictions.
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'import-x': importX },
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          basePath: import.meta.dirname,
          zones: [
            {
              target: './src/core/detailed',
              from: './src/core/quick',
              message: 'Detailed must not import Quick business logic (R5).',
            },
            {
              target: './src/core/quick',
              from: './src/core/detailed',
              message: 'Quick must not import Detailed business logic (R5).',
            },
            {
              target: './src/features/detailed',
              from: './src/core/quick',
              message: 'Detailed features must not import Quick business logic (R5).',
            },
            {
              target: './src/features/detailed',
              from: './src/features/quick-calc',
              message: 'Detailed features must not import Quick features (R5).',
            },
            {
              target: './src/features/quick-calc',
              from: './src/core/detailed',
              message: 'Quick features must not import Detailed business logic (R5).',
            },
            {
              target: './src/features/quick-calc',
              from: './src/features/detailed',
              message: 'Quick features must not import Detailed features (R5).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'core must stay React-free.' },
            { name: 'react-dom', message: 'core must stay React-free.' },
          ],
          patterns: [
            { group: ['**/features/**'], message: 'core must not import the feature layer.' },
            { group: ['**/components/**'], message: 'core must not import UI components.' },
            { group: ['**/data/**'], message: 'core must not import benchmark data.' },
          ],
        },
      ],
    },
  },
)
