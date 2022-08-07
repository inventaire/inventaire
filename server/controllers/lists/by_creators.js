const lists_ = require('controllers/lists/lib/lists')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const { paginate } = require('controllers/items/lib/queries_commons')

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
}
const controller = async ({ users, offset, limit, reqUserId }) => {
  const foundLists = await lists_.byCreators(users)
  const allVisibleLists = await filterVisibleDocs(foundLists, reqUserId)
  const { items: authorizedLists } = paginate(allVisibleLists, { offset, limit })
  return {
    lists: authorizedLists,
  }
}

module.exports = { sanitization, controller }
