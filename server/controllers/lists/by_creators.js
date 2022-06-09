const _ = require('builders/utils')
const lists_ = require('controllers/lists/lib/lists')
const filterVisibleDocs = require('lib/filter_visible_docs')
const { Paginate } = require('controllers/items/lib/queries_commons')

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true },
}
const controller = async ({ users, offset, limit, reqUserId }) => {
  const foundLists = await lists_.byCreators(users)
  const { items: authorizedLists } = await filterVisibleDocs(foundLists, reqUserId)
    .then(Paginate({ offset, limit }))
  const lists = _.keyBy(authorizedLists, '_id')
  return { lists }
}

module.exports = { sanitization, controller }
