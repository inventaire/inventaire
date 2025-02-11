import { groupBy } from 'lodash-es'
import { filterMaximumItemsPerOwner } from '#controllers/items/lib/filter_maximum_items_per_owner'
import { getAuthorizedItemsByUsers } from '#controllers/items/lib/get_authorized_items'
import { removeUnauthorizedShelves, addItemsSnapshots } from '#controllers/items/lib/queries_commons'
import { getUsersByBbox } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { SerializedItem } from '#types/item'
import type { User } from '#types/user'

const sanitization = {
  bbox: {},
  limit: {
    default: 15,
  },
  lang: {
    default: 'en',
  },
}

async function controller (params: SanitizedParameters) {
  const { bbox, limit, lang, reqUserId } = params
  const foundUsers: User[] = await getUsersByBbox(bbox)
  const usersByIds = groupBy(foundUsers, '_id')
  const usersIds = Object.keys(usersByIds)
  const authorizedItems = await getAuthorizedItemsByUsers(usersIds, params.reqUserId)

  const filteredItems = filterMaximumItemsPerOwner(authorizedItems, lang, limit)

  const serializedItems: SerializedItem[] = await addItemsSnapshots(filteredItems)
  await removeUnauthorizedShelves(serializedItems, reqUserId)
  return { items: serializedItems, users: foundUsers }
}

export default { sanitization, controller }
