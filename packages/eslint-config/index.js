const globals = require('globals')
const prettierConfig = require('eslint-config-prettier')
const eslint = require('@eslint/js')
const prettierPlugin = require('eslint-plugin-prettier')
const mochaPlugin = require('eslint-plugin-mocha')
const typescriptEslint = require('typescript-eslint')
const evmAddressPlugin = require('eslint-plugin-evm-address-to-checksummed')
const jsonPlugin = require('eslint-plugin-json')

/**
 * @type {ESLintConfig}
 */
module.exports = [
  eslint.configs.recommended,
  prettierConfig,
  ...typescriptEslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: typescriptEslint.parser,
      parserOptions: {
        // project: true,
      },
      globals: {
        ...globals.es2020,
        ...globals.node,
        ...globals.browser,
        ...globals.jest,
        ...globals.mocha,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    plugins: {
      '@typescript-eslint': typescriptEslint.plugin,
      prettier: prettierPlugin,
      mocha: mochaPlugin,
      'evm-address-to-checksummed': evmAddressPlugin,
      json: jsonPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'linebreak-style': ['error', 'unix'],
      'mocha/no-exclusive-tests': 'error',
      quotes: [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: false },
      ],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
      'brace-style': 'off',
      'no-constant-condition': 'off',
      'no-promise-executor-return': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-namespace': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'evm-address-to-checksummed/evm-address-to-checksummed': 'error',
      '@typescript-eslint/no-require-imports': 'warn',
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {},
      },
    },
  },
  {
    files: ['**/*.json'],
    ...jsonPlugin.configs.recommended,
    rules: {
      'json/json': ['error', { allowComments: true }],
    },
  },
  {
    ignores: [
      'node_modules',
      'build',
      'coverage',
      'dist',
      'out',
      'src/@generated/',
      'eslint.config.js',
      'artifacts',
      'dist',
      'cache',
      'typechain-types',
    ],
  },
]
