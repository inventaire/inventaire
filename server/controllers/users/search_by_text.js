import { buildSearcher } from 'lib/elasticsearch'
import queryBuilder from 'controllers/search/lib/social_query_builder'

const sanitization = {
  search: {}
}

const controller = async ({ search }) => {
  const users = await searchByText({ search })
  return { users }
}

const searchByText = buildSearcher({
  dbBaseName: 'users',
  queryBuilder
})

export default { sanitization, controller }
