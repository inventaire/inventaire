
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const user_ = __.require('controllers', 'user/lib/user')
const promises_ = __.require('lib', 'promises')
const { addAssociatedData, Paginate } = require('./queries_commons')
const getByAccessLevel = require('./get_by_access_level')

module.exports = (page, usersIds) => {
  // Allow to pass users ids either through the page object
  // or as an additional argument
  if (!usersIds) { usersIds = page.users }
  const { reqUserId } = page

  return getRelations(reqUserId, usersIds)
  .then(fetchRelationsItems(reqUserId))
  .then(Paginate(page))
  .then(addAssociatedData)
}

const getRelations = (reqUserId, usersIds) => {
  // All users are considered public users when the request isn't authentified
  if (reqUserId == null) return promises_.resolve({ public: usersIds })

  const relations = {}
  if (usersIds.includes(reqUserId)) {
    relations.user = reqUserId
    usersIds = _.without(usersIds, reqUserId)
  }

  if (usersIds.length === 0) return promises_.resolve(relations)

  return user_.getRelationsStatuses(reqUserId, usersIds)
  .spread((friends, coGroupMembers, publik) => {
    relations.network = friends.concat(coGroupMembers)
    relations.public = publik
    return relations
  })
}

const fetchRelationsItems = reqUserId => relations => {
  const itemsPromises = []
  const { user, network, public: publik } = relations

  if (user != null) { itemsPromises.push(getByAccessLevel.private(user, reqUserId)) }
  if (network != null) { itemsPromises.push(getByAccessLevel.network(network, reqUserId)) }
  if (publik != null) { itemsPromises.push(getByAccessLevel.public(publik, reqUserId)) }

  return promises_.all(itemsPromises).then(_.flatten)
}
