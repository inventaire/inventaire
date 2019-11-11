// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { allowTransaction } = __.require('models', 'item')
const { kmBetween } = __.require('lib', 'geo')
const host = CONFIG.fullPublicHost()
const transacColors = require('./transactions_colors')

module.exports = {
  getLastItems(limitDate, items){
    return items.filter(item => item.created > limitDate)
  },

  formatData(lastItems, label, lang, highlighted){
    let formattedItems
    const more = lastItems.length - highlighted.length
    return formattedItems = {
      display: highlighted.length > 0,
      highlighted: highlighted.map(addUserLang(lang)),
      title: `last_${label}_books`,
      more: {
        display: more > 0,
        smart_count: more,
        title: `last_${label}_books_more`
      }
    }
  },

  embedUsersData(items, users, position){
    users = _.keyBy(users, '_id')
    return items.map((item) => {
      const user = users[item.owner]
      if (user != null) {
        item.href = `${host}/items/${item._id}`
        item.user = _.pick(user, requiredUserData)
        if ((user.position != null) && (position != null)) {
          item.user.distance = kmBetween(user.position, position)
        }
        item.user.href = `${host}/inventory/${user.username}`
        item.transacLabel = `${item.transaction}_personalized_strong`
        item.transacColor = transacColors[item.transaction]
      }
      return item
    })
  },

  getHighlightedItems(lastItems, highlightedLength){
    if (lastItems.length <= highlightedLength) return lastItems
    return getItemsWithTransactionFirst(lastItems, highlightedLength)
  }
}

var requiredUserData = [ 'username', 'picture' ]

var getItemsWithTransactionFirst = function(lastItems, highlightedLength){
  // create a new array as items.pop() would affect lastItems everywhere
  const items = _.clone(lastItems)
  const withTransaction = []
  const withoutTransaction = []
  // go through all items until withTransaction is equal to
  // the expected amount of highlightedItems
  while ((withTransaction.length < highlightedLength) && (items.length > 0)) {
    const item = items.pop()
    if (allowTransaction(item)) { withTransaction.push(item)
    } else { withoutTransaction.push(item) }
  }

  if (withTransaction.length === highlightedLength) { return withTransaction
  // in case there are less items with transactions than expected
  // concating items without transactions
  } else { return withTransaction.concat(withoutTransaction).slice(0, highlightedLength) }
}

var addUserLang = lang => (function(item) {
  item.userLang = lang
  return item
})
