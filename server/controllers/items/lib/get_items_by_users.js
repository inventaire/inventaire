const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const { addAssociatedData, Paginate } = require('./queries_commons')
const getByAccessLevel = require('./get_by_access_level')
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

const getRelations = (reqUserId, usersIds) => {
  // All users are considered public users when the request isn't authentified
  if (reqUserId == null) return promises_.resolve({ public: usersIds })

  const relations = {}
  if (usersIds.includes(reqUserId)) {
    relations.user = reqUserId
    usersIds = _.without(usersIds, reqUserId)
  }

  if (usersIds.length === 0) return promises_.resolve(relations)

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
    itemsPromises.push(getByAccessLevel.private(user, reqUserId))
  }

  if (network) {
    itemsPromises.push(getByAccessLevel.network(network, reqUserId))
  }

  if (publik) {
    itemsPromises.push(getByAccessLevel.public(publik, reqUserId))
  }

  return promises_.all(itemsPromises).then(_.flatten)
}
