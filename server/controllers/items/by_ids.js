// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const items_ = __.require('controllers', 'items/lib/items')
const user_ = __.require('controllers', 'user/lib/user')
const relations_ = __.require('controllers', 'relations/lib/queries')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { addAssociatedData, listingIs, Paginate } = require('./lib/queries_commons')
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

module.exports = (req, res) => sanitize(req, res, sanitization)
.then((params) => {
  const { ids, includeUsers, reqUserId } = params
  return promises_.all([
    items_.byIds(ids),
    getNetworkIds(reqUserId)
  ])
  .spread(filterAuthorizedItems(reqUserId))
  // Paginating isn't really required when requesting items by ids
  // but it also handles sorting and the consistency of the API
  .then(Paginate(params))
  .then(addAssociatedData)}).then(responses_.Send(res))
.catch(error_.Handler(req, res))

var getNetworkIds = function(reqUserId){
  if (reqUserId != null) { return relations_.getUserFriendsAndCoGroupsMembers(reqUserId)
  } else { return [] }
}

var filterAuthorizedItems = reqUserId => (items, networkIds) => _.compact(items)
.map(filterByAuthorization(reqUserId, networkIds))
// Keep non-nullified items
.filter(_.identity)

var filterByAuthorization = (reqUserId, networkIds) => (function(item) {
  const { owner:ownerId, listing } = item

  if (ownerId === reqUserId) { return item

  } else if (networkIds.includes(ownerId)) {
    // Filter-out private item for network users
    if (listing !== 'private') return omitPrivateAttributes(item)

  } else {
    // Filter-out all non-public items for non-network users
    if (listing === 'public') return omitPrivateAttributes(item)
  }
})
