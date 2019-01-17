CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
getItemsByAccessLevel = require './get_by_access_level'
relations_ = __.require 'controllers', 'relations/lib/queries'
user_ = __.require 'controllers', 'user/lib/user'
{ getLastItems, formatData, embedUsersData, getHighlightedItems } = require './last_books_helpers'

module.exports = (userId, lang, limitDate = 0)->
  # get network ids
  relations_.getUserFriendsAndCoGroupsMembers userId
  # get last network items available for a transaction
  .then getItemsByAccessLevel.network
  .map items_.serializeData
  .then getLastItems.bind(null, limitDate)
  .then extractHighlightedItems(lang)
  .catch _.ErrorRethrow('last network items')

extractHighlightedItems = (lang)-> (lastItems)->
  highlighted = getHighlightedItems lastItems, 10
  attachUsersData highlighted
  .then formatData.bind(null, lastItems, 'network', lang)

attachUsersData = (items, lang)->
  usersIds = _.uniq items.map(_.property('owner'))
  user_.byIds usersIds
  .then embedUsersData.bind(null, items)
