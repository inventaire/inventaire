const _ = require('builders/utils')
const { validFilters } = require('controllers/items/lib/queries_commons')
const lists_ = require('controllers/lists/lib/lists')
const filterVisibleDocs = require('lib/filter_visible_docs')
const { Paginate } = require('controllers/items/lib/queries_commons')

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
  filter: {
    allowlist: validFilters,
    optional: true
  },
}
const controller = async ({ users, offset, limit, filter, reqUserId }) => {
  const foundLists = await lists_.byCreators(users)
  const { items: authorizedLists } = await filterVisibleDocs(foundLists, reqUserId)
    .then(Paginate({ offset, limit, filter }))
  const lists = _.keyBy(authorizedLists, '_id')
  return { lists }
}

module.exports = { sanitization, controller }
