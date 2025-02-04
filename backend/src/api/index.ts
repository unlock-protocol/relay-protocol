import { Hono } from 'hono'
import { graphql } from 'ponder'

const app = new Hono()

app.use('/', graphql({ db, schema }))
app.use('/graphql', graphql({ db, schema }))

export default app
