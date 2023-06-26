import queryBuilder from '#controllers/search/lib/social_query_builder'
import { buildSearcher } from '#lib/elasticsearch'

const sanitization = {
  search: {},
}

const controller = async ({ search }) => {
  const { hits: users } = await searchByText({ search })
  return { users }
}

const searchByText = buildSearcher({
  dbBaseName: 'users',
  queryBuilder,
})

export default { sanitization, controller }
