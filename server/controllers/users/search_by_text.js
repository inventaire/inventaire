const { buildSearcher } = require('lib/elasticsearch')
const queryBuilder = require('controllers/search/lib/social_query_builder')

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

module.exports = { sanitization, controller }
