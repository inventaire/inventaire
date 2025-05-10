import queryBuilder from '#controllers/search/lib/social_query_builder'
import { buildSearcher } from '#lib/elasticsearch'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  search: {},
} as const

async function controller ({ search }: SanitizedParameters) {
  const { hits: users } = await searchByText({ search })
  return { users }
}

const searchByText = buildSearcher({
  dbBaseName: 'users',
  queryBuilder,
})

export default { sanitization, controller }
