const _ = require('builders/utils')
const { filterPrivateAttributes } = require('controllers/shelves/lib/filter_private_attributes')
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
  let authorizedShelves = await filterVisibleDocs(foundShelves, reqUserId)
  authorizedShelves = authorizedShelves.map(filterPrivateAttributes(reqUserId))
  const shelves = _.keyBy(authorizedShelves, '_id')
  return { shelves }
}

module.exports = { sanitization, controller }
