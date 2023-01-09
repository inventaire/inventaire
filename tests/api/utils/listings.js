import _ from '#builders/utils'
import { customAuthReq } from './request.js'

const getByIds = async (user, ids, path) => {
  if (_.isArray(ids)) ids = ids.join('|')
  return customAuthReq(user, 'get', `/api/lists?action=by-ids&ids=${ids}`)
}

export async function getListingById (user, id) {
  const { lists } = await getByIds(user, id, 'lists')
  return lists[id]
}

export async function addElements (user, { id, uris }) {
  return customAuthReq(user, 'post', '/api/lists?action=add-elements', { id, uris })
}
