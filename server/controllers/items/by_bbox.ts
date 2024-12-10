import { property } from 'lodash-es'
import { filterMaximumItemsPerOwner } from '#controllers/items/lib/filter_maximum_items_per_owner'
import { getItemsByUsers } from '#controllers/items/lib/get_items_by_users'
import { getUsersByBbox } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { Item } from '#types/item'
import type { User, UserId } from '#types/user'

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
  const { bbox, limit, lang } = params
  const foundUsers: User[] = await getUsersByBbox(bbox)
  const usersIds: UserId[] = foundUsers.map(property('_id'))
  const { items, users }: { items: Item[], users: User[] } = await getItemsByUsers({ ...params, usersIds })

  const filteredItems = filterMaximumItemsPerOwner(items, lang, limit)
  return { items: filteredItems, users }
}

export default { sanitization, controller }
