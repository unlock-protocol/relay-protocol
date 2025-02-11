/**
 * This utility retrieves the latest active deployment ID for the backend service from Railway's API.
 *
 * The backend service deploys with this ID that is then used to namespace database tables.
 *
 * Required environment variables:
 * - BACKEND_PROJECT_ID
 * - RAILWAY_ENVIRONMENT_ID
 * - BACKEND_SERVICE_ID
 * - RAILWAY_API_TOKEN
 */

interface RailwayApiResponse {
  data: {
    deployments: {
      edges: Array<{
        node: {
          id: string
          staticUrl: string
        }
      }>
    }
  }
}

const LATEST_DEPLOYMENT_QUERY = `
  query deployments {
    deployments(
      first: 1,
      input: {
        projectId: "${process.env.BACKEND_PROJECT_ID}",
        environmentId: "${process.env.RAILWAY_ENVIRONMENT_ID}",
        serviceId: "${process.env.BACKEND_SERVICE_ID}"
      }
    ) {
      edges {
        node {
          id
          staticUrl
        }
      }
    }
  }
`

export async function getLatestDatabaseSchema(): Promise<string> {
  // Validate required environment variables.
  if (!process.env.RAILWAY_API_TOKEN) {
    throw new Error('Missing RAILWAY_API_TOKEN')
  }
  if (!process.env.BACKEND_PROJECT_ID) {
    throw new Error('Missing BACKEND_PROJECT_ID')
  }
  if (!process.env.RAILWAY_ENVIRONMENT_ID) {
    throw new Error('Missing RAILWAY_ENVIRONMENT_ID')
  }
  if (!process.env.BACKEND_SERVICE_ID) {
    throw new Error('Missing BACKEND_SERVICE_ID')
  }

  // Query the Railway API
  const response = await fetch('https://backboard.railway.com/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RAILWAY_API_TOKEN}`,
    },
    body: JSON.stringify({ query: LATEST_DEPLOYMENT_QUERY }),
  })

  const data = (await response.json()) as RailwayApiResponse

  if (data.data.deployments.edges.length === 0) {
    throw new Error('No deployments found')
  }

  return data.data.deployments.edges[0].node.id
}
