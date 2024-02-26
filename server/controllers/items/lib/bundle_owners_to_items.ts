import { uniq } from 'lodash-es'
import { getUsersAuthorizedDataByIds } from '#controllers/user/lib/user'
import { newError } from '#lib/error/error'

export default async (items, reqUserId) => {
  if (!(items && items.length > 0)) throw newError('no item found', 404)
  const usersIds = getItemsOwners(items)
  const users = await getUsersAuthorizedDataByIds(usersIds, reqUserId)
  return { items, users }
}

const getItemsOwners = items => {
  const users = items.map(item => item.owner)
  return uniq(users)
}
