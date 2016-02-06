CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
relations_ = __.require 'controllers', 'relations/lib/queries'
user_ = __.require 'lib', 'user/user'
{ getLastItems, formatData, embedUsersData, getHighlightedItems } = require './last_books_helpers'

module.exports = (userId, limitDate=0)->
  # get user friends ids
  relations_.getUserFriends userId
  # get last friends items available for a transaction
  .then items_.friendsListings
  .then getLastItems.bind(null, limitDate)
  .then extractHighlightedItems
  .catch _.ErrorRethrow('last friends items')

extractHighlightedItems = (lastItems)->
  highlighted = getHighlightedItems lastItems, 10
  attachUsersData highlighted
  .then formatData.bind(null, lastItems, 'friends')

attachUsersData = (items)->
  usersIds = _.uniq items.map(_.property('owner'))
  user_.byIds usersIds
  .then embedUsersData.bind(null, items)
