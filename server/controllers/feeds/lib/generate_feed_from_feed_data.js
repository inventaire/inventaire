import CONFIG from 'config'
import { map } from 'lodash-es'
import { filterPrivateAttributes } from '#controllers/items/lib/filter_private_attributes'
import { getAuthorizedItemsByShelves, getAuthorizedItemsByUsers } from '#controllers/items/lib/get_authorized_items'
import { paginate } from '#controllers/items/lib/queries_commons'
import { addSnapshotToItem } from '#controllers/items/lib/snapshot/snapshot'
import { serializeUserData } from '#controllers/user/lib/user'
import serializeFeed from './serialize_feed.js'

const { feed: feedConfig } = CONFIG

export default lang => async ({ reqUserId, feedOptions, users, shelves, context }) => {
  users = users.map(serializeUserData)
  const usersIds = map(users, '_id')
  let items
  if (shelves) {
    items = await getAuthorizedItemsByShelves(shelves, reqUserId)
  } else {
    items = await getAuthorizedItemsByUsers(usersIds, reqUserId)
  }
  const page = paginate(items, {
    context,
    limit: feedConfig.limitLength,
  })
  items = await Promise.all(page.items.map(addSnapshotToItem))
  items = items.map(filterPrivateAttributes(reqUserId))
  return serializeFeed(feedOptions, users, items, lang)
}
