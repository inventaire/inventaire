import type { AwaitableUserWithCookie } from '#fixtures/users'
import { isArray } from '#lib/boolean_validations'
import { forceArray } from '#lib/utils/base'
import { customAuthReq } from '#tests/api/utils/request'
import type { Item, ItemId } from '#types/item'
import { authReq, getUser } from './utils.js'

export function getItemsByIds (ids: ItemId | ItemId[]) {
  if (isArray(ids)) ids = ids.join('|')
  return authReq('get', `/api/items?action=by-ids&ids=${ids}`)
}

export async function getItemById (id: ItemId) {
  const { items } = await getItemsByIds(id)
  return items[0]
}

export const getItem = async (item: Item) => getItemById(item._id)

export function deleteItemsByIds (ids: ItemId | ItemId[]) {
  ids = forceArray(ids)
  return authReq('post', '/api/items?action=delete-by-ids', { ids })
}

export function updateItems ({ ids, attribute, value, user }: { ids: ItemId | ItemId[], attribute: string, value: unknown, user?: AwaitableUserWithCookie }) {
  ids = forceArray(ids)
  user ??= getUser()
  return customAuthReq(user, 'put', '/api/items?action=bulk-update', { ids, attribute, value })
}

export function updateItem (item: Item, user?: AwaitableUserWithCookie) {
  user ??= getUser()
  return customAuthReq(user, 'put', '/api/items', item)
}
