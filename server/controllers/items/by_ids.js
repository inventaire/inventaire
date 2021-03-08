const __ = require('config').universalPath
const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const { getNetworkIds } = require('controllers/user/lib/relations_status')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const { addAssociatedData, Paginate } = require('./lib/queries_commons')
const { omitPrivateAttributes } = require('./lib/filter_private_attributes')

const sanitization = {
  ids: {},
  limit: { optional: true },
  offset: { optional: true },
  'include-users': {
    generic: 'boolean',
    default: false
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { ids, reqUserId } = params
    return Promise.all([
      items_.byIds(ids),
      getNetworkIds(reqUserId)
    ])
    .then(filterAuthorizedItems(reqUserId))
    // Paginating isn't really required when requesting items by ids
    // but it also handles sorting and the consistency of the API
    .then(Paginate(params))
    .then(addAssociatedData)
  })
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const filterAuthorizedItems = reqUserId => ([ items, networkIds ]) => {
  return _.compact(items)
  .map(filterByAuthorization(reqUserId, networkIds))
  // Keep non-nullified items
  .filter(_.identity)
}

const filterByAuthorization = (reqUserId, networkIds) => item => {
  const { owner: ownerId, listing } = item

  if (ownerId === reqUserId) {
    return item
  } else if (networkIds.includes(ownerId)) {
    // Filter-out private item for network users
    if (listing !== 'private') return omitPrivateAttributes(item)
  } else {
    // Filter-out non-public items for non-network users
    if (listing === 'public') return omitPrivateAttributes(item)
  }
}
