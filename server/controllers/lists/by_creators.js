const _ = require('builders/utils')
const lists_ = require('controllers/lists/lib/lists')
const filterVisibleDocs = require('lib/filter_visible_docs')

const sanitization = {
  users: {},
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async params => {
  const { reqUserId, users } = params
  const foundLists = await lists_.byCreators(users)
  const authorizedLists = await filterVisibleDocs(foundLists, reqUserId)
  const lists = _.keyBy(authorizedLists, '_id')
  return { lists }
}

module.exports = { sanitization, controller }
