const _ = require('builders/utils')
const shelves_ = require('controllers/shelves/lib/shelves')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')

const sanitization = {
  owners: {},
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async params => {
  const { reqUserId, owners } = params
  const foundShelves = await shelves_.byOwners(owners)
  const authorizedShelves = await filterVisibleDocs(foundShelves, reqUserId)
  const shelves = _.keyBy(authorizedShelves, '_id')
  return { shelves }
}

module.exports = { sanitization, controller }
