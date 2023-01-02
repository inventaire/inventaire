import CONFIG from 'config'
import _ from '#builders/utils'
import snapshot_ from '#controllers/items/lib/snapshot/snapshot'
import getAuthorizedItems from '#controllers/items/lib/get_authorized_items'
import user_ from '#controllers/user/lib/user'
import { filterPrivateAttributes } from '#controllers/items/lib/filter_private_attributes'
import { paginate } from '#controllers/items/lib/queries_commons'
import serializeFeed from './serialize_feed.js'

const { feed: feedConfig } = CONFIG

export default lang => async ({ reqUserId, feedOptions, users, shelves, filter }) => {
  users = users.map(user_.serializeData)
  const usersIds = _.map(users, '_id')
  let items
  if (shelves) {
    items = await getAuthorizedItems.byShelves(shelves, reqUserId)
  } else {
    items = await getAuthorizedItems.byUsers(usersIds, reqUserId)
  }
  const page = paginate(items, {
    filter,
    limit: feedConfig.limitLength,
  })
  items = await Promise.all(page.items.map(snapshot_.addToItem))
  items = items.map(filterPrivateAttributes(reqUserId))
  return serializeFeed(feedOptions, users, items, lang)
}
