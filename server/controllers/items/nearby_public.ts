import { property, keyBy } from 'lodash-es'
import { filterMaximumItemsPerOwner } from '#controllers/items/lib/filter_maximum_items_per_owner'
import { getItemsByUsers } from '#controllers/items/lib/get_items_by_users'
import { getUsersFromArea } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

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
  const foundUsers = await getUsersFromArea(bbox)
  const usersIds = foundUsers.map(property('_id'))
  const { items, users } = await getItemsByUsers({ ...params, usersIds })

  const filteredItems = filterMaximumItemsPerOwner(items, lang, limit)
  const usersByIds = keyBy(users, '_id')
  assignPositionAndAnonymize(filteredItems, usersByIds)
  return { items: filteredItems }
}

export default { sanitization, controller }

function assignPositionAndAnonymize (items, usersByIds) {
  items.forEach(item => {
    const itemUser = usersByIds[item.owner]
    if (itemUser.position) {
      item.position = itemUser.position
    }
    delete item.owner
  })
  return items
}
