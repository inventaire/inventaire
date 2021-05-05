// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const getItemsByAccessLevel = require('controllers/items/lib/get_by_access_level')
const relations_ = require('controllers/relations/lib/queries')
const promises_ = require('lib/promises')
const user_ = require('controllers/user/lib/user')
const { getLastItems, formatData, embedUsersData, getHighlightedItems } = require('./last_books_helpers')

module.exports = (userId, lang, limitDate = 0) => {
  // Get network ids
  return relations_.getUserFriendsAndCoGroupsMembers(userId)
  // Get last network items available for a transaction
  .then(getItemsByAccessLevel.network)
  .then(promises_.map(items_.serializeData))
  .then(getLastItems.bind(null, limitDate))
  .then(extractHighlightedItems(lang))
  .catch(_.ErrorRethrow('last network items'))
}

const extractHighlightedItems = lang => lastItems => {
  const highlighted = getHighlightedItems(lastItems, 10)
  return attachUsersData(highlighted)
  .then(formatData.bind(null, lastItems, 'network', lang))
}

const attachUsersData = (items, lang) => {
  const usersIds = _.uniq(items.map(_.property('owner')))
  return user_.byIds(usersIds)
  .then(embedUsersData.bind(null, items))
}
