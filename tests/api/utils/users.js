import { assert_ } from '#lib/utils/assert_types'
import { customAuthReq, getUser } from './utils.js'

export async function getUsersNearPosition (position, user) {
  user = user || (await getUser())
  const bbox = getBboxFromPosition(position)
  const url = `/api/users?action=search-by-position&bbox=${JSON.stringify(bbox)}`
  const { users } = await customAuthReq(user, 'get', url)
  return users
}

export async function updateUser ({ user, attribute, value }) {
  user = await (user || getUser())
  assert_.object(user)
  assert_.string(attribute)
  return customAuthReq(user, 'put', '/api/user', { attribute, value })
}

export const deleteUser = user => customAuthReq(user, 'delete', '/api/user')

const getBboxFromPosition = ([ lat, lng ]) => {
  return [ lng - 0.1, lat - 0.1, lng + 0.1, lat + 0.1 ]
}
