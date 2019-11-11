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
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const { addAssociatedData, Paginate } = require('./lib/queries_commons')
const { filterPrivateAttributes } = require('./lib/filter_private_attributes')

const sanitization = {
  uris: {},
  limit: { optional: true },
  offset: { optional: true }
}

module.exports = (req, res) => sanitize(req, res, sanitization)
.then(getEntitiesItems)
.then(addAssociatedData)
.then(responses_.Send(res))
.catch(error_.Handler(req, res))

var getEntitiesItems = function(page){
  const { uris, reqUserId } = page

  return promises_.all([
    getUserItems(reqUserId, uris),
    getNetworkItems(reqUserId, uris),
    items_.publicByEntities(uris)
  ])
  .spread((userItems, networkItems, publicItems) => {
    // Only add user and network keys for the authorized endpoint
    if (reqUserId != null) {
      const dedupPublicItems = deduplicateItems(userItems, networkItems, publicItems)
      return userItems.concat(networkItems).concat(dedupPublicItems)
    } else {
      return publicItems
    }}).then(Paginate(page))
}

var getUserItems = function(reqUserId, uris){
  if (reqUserId == null) return []

  return items_.byOwnersAndEntitiesAndListings([ reqUserId ], uris, 'user', reqUserId)
}

var getNetworkItems = function(reqUserId, uris){
  if (reqUserId == null) return []

  return relations_.getUserFriendsAndCoGroupsMembers(reqUserId)
  .then(networkUsersIds => items_.byOwnersAndEntitiesAndListings(networkUsersIds, uris, 'network', reqUserId))
}

var deduplicateItems = function(userItems, networkItems, publicItems){
  const userAndNetworkItemsIds = userItems.map(getId).concat(networkItems.map(getId))

  return publicItems
  .filter(item => !userAndNetworkItemsIds.includes(item._id))
}

var getId = _.property('_id')
