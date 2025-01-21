import { CodegenConfig } from '@graphql-codegen/cli'

/**
 * Configuration for GraphQL Code Generator
 * This generates TypeScript types and a type-safe SDK from our GraphQL schema and operations
 *
 * Key features:
 * - Generates TypeScript types for all GraphQL types
 * - Generates type-safe query methods through graphql-request
 * - Configures raw request mode for better error handling
 * - Skips __typename fields for cleaner types
 */
const config: CodegenConfig = {
  // Path to the GraphQL schema
  schema: '../../backend/generated/schema.graphql',
  // Path pattern for GraphQL operation files
  documents: ['src/**/*.graphql'],
  generates: {
    './src/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        rawRequest: true,
        skipTypename: true,
      },
    },
  },
}

export default config
