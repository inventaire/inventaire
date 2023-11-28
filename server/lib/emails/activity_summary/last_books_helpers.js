import CONFIG from 'config'
import { clone, keyBy, pick } from 'lodash-es'
import { serializeUserData } from '#controllers/user/lib/user'
import { kmBetween } from '#lib/geo'
import Item from '#models/item'
import transactionsColors from './transactions_colors.js'

const { allowTransaction } = Item

const host = CONFIG.getPublicOrigin()

export const getLastItems = (limitDate, items) => {
  return items.filter(item => item.created > limitDate)
}

export const formatData = (lastItems, label, lang, highlighted) => {
  const more = lastItems.length - highlighted.length
  return {
    display: highlighted.length > 0,
    highlighted: highlighted.map(addUserLang(lang)),
    title: `last_${label}_books`,
    more: {
      display: more > 0,
      smart_count: more,
      title: `last_${label}_books_more`,
    },
  }
}

export const embedUsersData = (items, users, position) => {
  users = users.map(serializeUserData)
  users = keyBy(users, '_id')
  return items.map(item => {
    const user = users[item.owner]
    if (user) {
      item.href = `${host}/items/${item._id}`
      item.user = pick(user, requiredUserData)
      if ((user.position != null) && (position != null)) {
        item.user.distance = kmBetween(user.position, position)
      }
      item.user.href = `${host}/inventory/${user.username}`
      item.transactionLabel = `${item.transaction}_personalized_strong`
      item.transactionColor = transactionsColors[item.transaction]
    }
    return item
  })
}

export const getHighlightedItems = (lastItems, highlightedLength) => {
  if (lastItems.length <= highlightedLength) return lastItems
  return getItemsWithTransactionFirst(lastItems, highlightedLength)
}

const requiredUserData = [ 'username', 'picture' ]

const getItemsWithTransactionFirst = (lastItems, highlightedLength) => {
  // create a new array as items.pop() would affect lastItems everywhere
  const items = clone(lastItems)
  const withTransaction = []
  const withoutTransaction = []
  // go through all items until withTransaction is equal to
  // the expected amount of highlightedItems
  while ((withTransaction.length < highlightedLength) && (items.length > 0)) {
    const item = items.pop()
    if (allowTransaction(item)) {
      withTransaction.push(item)
    } else {
      withoutTransaction.push(item)
    }
  }

  if (withTransaction.length === highlightedLength) {
    return withTransaction
  // in case there are less items with transactions than expected
  // concating items without transactions
  } else {
    return withTransaction.concat(withoutTransaction).slice(0, highlightedLength)
  }
}

const addUserLang = lang => item => {
  item.userLang = lang
  return item
}
