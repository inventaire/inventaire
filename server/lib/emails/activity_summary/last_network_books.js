/* eslint-disable
    implicit-arrow-linebreak,
*/

// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const items_ = __.require('controllers', 'items/lib/items')
const getItemsByAccessLevel = __.require('controllers', 'items/lib/get_by_access_level')
const relations_ = __.require('controllers', 'relations/lib/queries')
const user_ = __.require('controllers', 'user/lib/user')
const { getLastItems, formatData, embedUsersData, getHighlightedItems } = require('./last_books_helpers')

module.exports = (userId, lang, limitDate = 0) => // get network ids
  relations_.getUserFriendsAndCoGroupsMembers(userId)
// get last network items available for a transaction
.then(getItemsByAccessLevel.network)
.map(items_.serializeData)
.then(getLastItems.bind(null, limitDate))
.then(extractHighlightedItems(lang))
.catch(_.ErrorRethrow('last network items'))

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
