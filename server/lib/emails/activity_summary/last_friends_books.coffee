CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
{ allowTransaction } = __.require 'models', 'item'
relations_ = __.require 'controllers', 'relations/lib/queries'
user_ = __.require 'lib', 'user/user'
{ oneDay } =  __.require 'lib', 'times'
highlightedItems = 1
# highlightedItems = 0
host = CONFIG.fullPublicHost()

module.exports = (userId, periodicity)->
  # get user friends ids
  relations_.getUserFriends userId
  # get last friends items available for a transaction
  .then items_.friendsListings
  .then getLastItems.bind(null, periodicity)
  .then extractHighlightedItems
  .catch _.Error('last friends items')

getLastItems = (periodicity, allFriendsItems)->
  limitDate = _.now() - periodicity*oneDay
  return allFriendsItems.filter (item)-> item.created > limitDate

extractHighlightedItems = (lastItems)->
  highlighted = getHighlightedItems lastItems
  attachUsersData highlighted
  .then formatData.bind(null, lastItems)

getHighlightedItems = (lastItems)->
  unless lastItems.length > highlightedItems then return lastItems
  return getItemsWithTransactionFirst lastItems

attachUsersData = (items)->
  usersIds = _.uniq items.map(_.property('owner'))
  user_.byIds usersIds
  .then indexById
  .then embedUsersData.bind(null, items)

indexById = (users)-> _.indexBy users, '_id'

requiredUserData = [ 'username', 'picture' ]
embedUsersData = (items, users)->
  items.map (item)->
    user = users[item.owner]
    if user?
      item.user = _.pick user, requiredUserData
      item.href = "#{host}/inventory/#{user.username}/#{item.entity}"
    return item

formatData = (lastItems, highlighted)->
  more = lastItems.length - highlighted.length
  return formattedItems =
    display: highlighted.length > 0
    highlighted: highlighted
    more:
      display: more > 0
      smart_count: more


getItemsWithTransactionFirst = (items)->
  withTransaction = []
  withoutTransaction = []
  # go through all items until withTransaction is equal to
  # the expected amount of highlightedItems
  while withTransaction.length < highlightedItems and items.length > 0
    item = items.pop()
    if allowTransaction(item) then withTransaction.push item
    else withoutTransaction.push item

  if withTransaction.length is highlightedItems then return withTransaction
  # in case there are less items with transactions than expected
  # concating items without transactions
  else return withTransaction.concat(withoutTransaction)[0...highlightedItems]
