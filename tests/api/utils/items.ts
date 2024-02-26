import { isArray } from 'lodash-es'
import { forceArray } from '#lib/utils/base'
import { customAuthReq } from '#tests/api/utils/request'
import { authReq, getUser } from './utils.js'

export const getItemsByIds = ids => {
  if (isArray(ids)) ids = ids.join('|')
  return authReq('get', `/api/items?action=by-ids&ids=${ids}`)
}

export const getItemById = async id => {
  const { items } = await getItemsByIds(id)
  return items[0]
}

export const getItem = async item => getItemById(item._id)

export const deleteItemsByIds = ids => {
  ids = forceArray(ids)
  return authReq('post', '/api/items?action=delete-by-ids', { ids })
}

export const updateItems = ({ ids, attribute, value, user }) => {
  ids = forceArray(ids)
  user = user || getUser()
  return customAuthReq(user, 'put', '/api/items?action=bulk-update', { ids, attribute, value })
}
