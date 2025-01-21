import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import jsoncParser from 'jsonc-eslint-parser'

export default [
  {
    ignores: ['node_modules/', 'dist/'],
  },
  eslintConfigPrettier,
  {
    plugins: {
      prettier: eslintPluginPrettier,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          trailingComma: 'es5',
          singleQuote: true,
          semi: false,
          tabWidth: 2,
          useTabs: false,
          printWidth: 100,
          bracketSpacing: true,
          endOfLine: 'lf',
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
  },
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: jsoncParser,
    },
  },
]
