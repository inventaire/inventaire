import { groupBy } from 'lodash-es'
import { removeUnauthorizedShelves } from '#controllers/items/lib/queries_commons'
import { searchUsersItems } from '#controllers/items/lib/search_users_items'
import { getUsersByBbox } from '#controllers/user/lib/user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { User } from '#types/user'

const sanitization = {
  bbox: {},
  limit: {
    default: 15,
    max: 100,
  },
  offset: {
    default: 0,
  },
  lang: {
    default: 'en',
  },
}

async function controller (params: SanitizedParameters) {
  const { bbox, limit, offset, reqUserId } = params
  const foundUsers: User[] = await getUsersByBbox(bbox)
  const usersByIds = groupBy(foundUsers, '_id')
  const usersIds = Object.keys(usersByIds)
  const { hits: items } = await searchUsersItems({
    ownersIdsAndVisibilityKeys: usersIds.map(userId => [ userId, [ 'public' ] ]),
    sortByDate: true,
    limit,
    offset,
  })
  // TODO: recover limit per user for /welcome but not /users/public
  await removeUnauthorizedShelves(items, reqUserId)
  return { items, users: foundUsers }
}

export default { sanitization, controller }
