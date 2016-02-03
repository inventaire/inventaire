CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ allowTransaction } = __.require 'models', 'item'
{ kmBetween } = __.require 'lib', 'geo'
host = CONFIG.fullPublicHost()

module.exports =
  getLastItems: (limitDate, items)->
    return items.filter (item)-> item.created > limitDate

  formatData: (lastItems, label, highlighted)->
    more = lastItems.length - highlighted.length
    return formattedItems =
      display: highlighted.length > 0
      highlighted: highlighted
      title: "last_#{label}_books"
      more:
        display: more > 0
        smart_count: more
        title: "last_#{label}_books_more"

  embedUsersData: (items, users, position)->
    users = indexById users
    items.map (item)->
      user = users[item.owner]
      if user?
        item.href = "#{host}/inventory/#{user.username}/#{item.entity}"
        item.user = _.pick user, requiredUserData
        item.user.distance = kmBetween user.position, position
        item.user.href = "#{host}/inventory/#{user.username}"
        item.transacLabel = "#{item.transaction}_personalized_strong"
        item.transacColor = transacColors[item.transaction]
      return item

  getHighlightedItems: (lastItems, highlightedLength)->
    if lastItems.length <= highlightedLength then return lastItems
    return getItemsWithTransactionFirst lastItems, highlightedLength

requiredUserData = [ 'username', 'picture' ]

indexById = (users)-> _.indexBy users, '_id'

getItemsWithTransactionFirst = (lastItems, highlightedLength)->
  # create a new array as items.pop() would affect lastItems everywhere
  items = lastItems.clone()
  withTransaction = []
  withoutTransaction = []
  # go through all items until withTransaction is equal to
  # the expected amount of highlightedItems
  while withTransaction.length < highlightedLength and items.length > 0
    item = items.pop()
    if allowTransaction(item) then withTransaction.push item
    else withoutTransaction.push item

  if withTransaction.length is highlightedLength then return withTransaction
  # in case there are less items with transactions than expected
  # concating items without transactions
  else return withTransaction.concat(withoutTransaction)[0...highlightedLength]

transacColors =
  giving: '#FEB1BA'
  lending: '#9FD5B3'
  selling: '#FFE567'
  inventorying: '#BFBFBF'
