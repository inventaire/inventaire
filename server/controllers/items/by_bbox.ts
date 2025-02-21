import { groupBy } from 'lodash-es'
import { filterMaximumItemsPerOwner } from '#controllers/items/lib/filter_maximum_items_per_owner'
import { getAuthorizedItemsByUsers } from '#controllers/items/lib/get_authorized_items'
import { removeUnauthorizedShelves, addItemsSnapshots } from '#controllers/items/lib/queries_commons'
import { getUsersAuthorizedData, getUsersByBbox } from '#controllers/user/lib/user'
import { reqHasAdminAccess } from '#lib/user_access_levels'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { SerializedItem } from '#types/item'
import type { Req } from '#types/server'

const sanitization = {
  bbox: {},
  limit: {
    default: 15,
  },
  lang: {
    default: 'en',
  },
}

async function controller (params: SanitizedParameters, req: Req) {
  const { bbox, limit, lang, reqUserId } = params
  const reqUserHasAdminAccess = reqHasAdminAccess(req)
  const usersPromise = getUsersByBbox(bbox)
  const filteredUsers = await getUsersAuthorizedData(usersPromise, { reqUserId, reqUserHasAdminAccess })
  const usersByIds = groupBy(filteredUsers, '_id')
  const usersIds = Object.keys(usersByIds)
  const authorizedItems = await getAuthorizedItemsByUsers(usersIds, params.reqUserId)

  const filteredItems = filterMaximumItemsPerOwner(authorizedItems, lang, limit)

  const serializedItems: SerializedItem[] = await addItemsSnapshots(filteredItems)
  await removeUnauthorizedShelves(serializedItems, reqUserId)
  return { items: serializedItems, users: filteredUsers }
}

export default { sanitization, controller }
