import { getAuthorizedItemsByUsers } from '#controllers/items/lib/get_authorized_items'
import { serializeItemData } from '#controllers/items/lib/items'
import { getUsersAuthorizedDataByIds, getUsersNearby } from '#controllers/user/lib/user'
import { getLastItems, formatData, embedUsersData, getHighlightedItems } from './last_books_helpers.js'

const range = 20
const strictRange = true

export default async (user, limitDate = 0) => {
  const { _id: reqUserId, position, lang } = user

  if (position == null) return formatData([], 'nearby', lang, [])

  const usersIds = await getUsersNearby(reqUserId, range, strictRange)
  const [ items, users ] = await Promise.all([
    getAuthorizedItemsByUsers(usersIds, reqUserId),
    getUsersAuthorizedDataByIds(usersIds, reqUserId),
  ])

  return formatItems({ items, users, limitDate, position, lang })
}

const formatItems = ({ items, users, limitDate, position, lang }) => {
  items = items.map(serializeItemData)
  let lastItems = getLastItems(limitDate, items)
  const highlighted = getHighlightedItems(lastItems, 10)
  lastItems = embedUsersData(lastItems, users, position)
  return formatData(lastItems, 'nearby', lang, highlighted)
}
