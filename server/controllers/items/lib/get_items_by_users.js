const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { addAssociatedData, Paginate } = require('./queries_commons')
const getByAuthorizationLevel = require('./get_by_authorization_level')
const { getRelationsStatuses } = __.require('controllers', 'user/lib/relations_status')

module.exports = (page, usersIds) => {
  // Allow to pass users ids either through the page object
  // or as an additional argument
  if (!usersIds) usersIds = page.users
  const { reqUserId } = page

  return getRelations(reqUserId, usersIds)
  .then(fetchRelationsItems(reqUserId))
  .then(Paginate(page))
  .then(addAssociatedData)
}

const getRelations = async (reqUserId, usersIds) => {
  // All users are considered public users when the request isn't authentified
  if (reqUserId == null) return { public: usersIds }

  const relations = {}
  if (usersIds.includes(reqUserId)) {
    relations.user = reqUserId
    usersIds = _.without(usersIds, reqUserId)
  }

  if (usersIds.length === 0) return relations

  return getRelationsStatuses(reqUserId, usersIds)
  .then(([ friends, coGroupMembers, publik ]) => {
    relations.network = friends.concat(coGroupMembers)
    relations.public = publik
    return relations
  })
}

const fetchRelationsItems = reqUserId => relations => {
  const itemsPromises = []
  const { user, network, public: publik } = relations

  if (user) {
    itemsPromises.push(getByAuthorizationLevel.private(user, reqUserId))
  }

  if (network) {
    itemsPromises.push(getByAuthorizationLevel.network(network, reqUserId))
  }

  if (publik) {
    itemsPromises.push(getByAuthorizationLevel.public(publik, reqUserId))
  }

  return Promise.all(itemsPromises).then(_.flatten)
}
