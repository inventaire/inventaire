CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
relations_ = __.require 'controllers', 'relations/lib/queries'
user_ = __.require 'controllers', 'user/lib/user'
{ getLastItems, formatData, embedUsersData, getHighlightedItems } = require './last_books_helpers'

module.exports = (userId, limitDate=0)->
  # get network ids
  relations_.getUserFriendsAndCoGroupsMembers userId
  # get last network items available for a transaction
  .then items_.networkListings
  .map items_.importSnapshotData
  .then getLastItems.bind(null, limitDate)
  .then extractHighlightedItems
  .catch _.ErrorRethrow('last network items')

extractHighlightedItems = (lastItems)->
  highlighted = getHighlightedItems lastItems, 10
  attachUsersData highlighted
  .then formatData.bind(null, lastItems, 'network')

attachUsersData = (items)->
  usersIds = _.uniq items.map(_.property('owner'))
  user_.byIds usersIds
  .then embedUsersData.bind(null, items)
