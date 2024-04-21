import { clone, keyBy } from 'lodash-es'
import { serializeUserData } from '#controllers/user/lib/user'
import { kmBetween } from '#lib/geo'
import { itemAllowsTransactions } from '#models/item'
import config from '#server/config'
import type { LatLng, AbsoluteUrl, ColorHexCode } from '#types/common'
import type { SerializedItem } from '#types/item'
import type { User } from '#types/user'
import transactionsColors from './transactions_colors.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

const host = config.getPublicOrigin()

export function getLastItems (limitDate: EpochTimeStamp, items: SerializedItem[]) {
  return items.filter(item => item.created > limitDate)
}

export interface ActivitySummaryItemViewModel {
  item: SerializedItem
  itemHref: AbsoluteUrl
  user: User
  userLang?: WikimediaLanguageCode
  distance: number
  userHref: AbsoluteUrl
  transactionLabel: string
  transactionColor: ColorHexCode
}

export function getActivitySummaryItemsViewModels (items: SerializedItem[], users: User[], position?: LatLng) {
  users = users.map(serializeUserData)
  const usersByIds = keyBy(users, '_id')
  return items.map(item => {
    const user = usersByIds[item.owner]
    const itemHref: AbsoluteUrl = `${host}/items/${item._id}`
    let userHref: AbsoluteUrl
    let distance, transactionLabel, transactionColor
    if (user) {
      if ((user.position != null) && (position != null)) {
        distance = kmBetween(user.position, position)
      }
      userHref = `${host}/users/${user.username}`
      transactionLabel = `${item.transaction}_personalized_strong`
      transactionColor = transactionsColors[item.transaction]
    }
    const itemViewModel: ActivitySummaryItemViewModel = {
      item,
      itemHref,
      user,
      distance,
      userHref,
      transactionLabel,
      transactionColor,
    }
    return itemViewModel
  })
}

export function formatActivitySummaryItemsData (activitySummaryItemsViewModels: ActivitySummaryItemViewModel[], label: string, lang: WikimediaLanguageCode, lastItemsCount: number) {
  const more = activitySummaryItemsViewModels.length - lastItemsCount
  return {
    display: activitySummaryItemsViewModels.length > 0,
    highlighted: activitySummaryItemsViewModels.map(addSummaryUserLang(lang)),
    title: `last_${label}_books`,
    more: {
      display: more > 0,
      smart_count: more,
      title: `last_${label}_books_more`,
    },
  }
}

export function getHighlightedItems (lastItems: SerializedItem[], highlightedLength: number) {
  if (lastItems.length <= highlightedLength) return lastItems
  return getItemsWithTransactionFirst(lastItems, highlightedLength)
}

function getItemsWithTransactionFirst (lastItems: SerializedItem[], highlightedLength: number) {
  // create a new array as items.pop() would affect lastItems everywhere
  const items = clone(lastItems)
  const withTransaction = []
  const withoutTransaction = []
  // go through all items until withTransaction is equal to
  // the expected amount of highlightedItems
  while ((withTransaction.length < highlightedLength) && (items.length > 0)) {
    const item = items.pop()
    if (itemAllowsTransactions(item)) {
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

const addSummaryUserLang = (lang: WikimediaLanguageCode) => (itemViewModel: ActivitySummaryItemViewModel) => {
  itemViewModel.userLang = lang
  return itemViewModel
}
