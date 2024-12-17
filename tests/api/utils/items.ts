import type { AwaitableUserWithCookie } from '#fixtures/users'
import { isArray } from '#lib/boolean_validations'
import { forceArray } from '#lib/utils/base'
import { customAuthReq } from '#tests/api/utils/request'
import type { Item } from '#types/item'
import { authReq, getUser } from './utils.js'

export function getItemsByIds (ids) {
  if (isArray(ids)) ids = ids.join('|')
  return authReq('get', `/api/items?action=by-ids&ids=${ids}`)
}

export async function getItemById (id) {
  const { items } = await getItemsByIds(id)
  return items[0]
}

export const getItem = async item => getItemById(item._id)

export function deleteItemsByIds (ids) {
  ids = forceArray(ids)
  return authReq('post', '/api/items?action=delete-by-ids', { ids })
}

export function updateItems ({ ids, attribute, value, user }) {
  ids = forceArray(ids)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/items?action=bulk-update', { ids, attribute, value })
}

export function updateItem (item: Item, user?: AwaitableUserWithCookie) {
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/items', item)
}
