import { getUser } from '#tests/api/utils/utils'
import { customAuthReq } from './request.js'

const endpoint = '/api/lists?action='
const byId = 'by-id'

export async function getListingById ({ user, id }) {
  user = user || getUser()
  const path = `${endpoint}${byId}&id=${id}`
  const { list: listing } = await customAuthReq(user, 'get', path)
  return listing
}

export async function getByIdWithElements ({ user, id }) {
  return getListingById({ user, id, params: '&with-elements=true' })
}

export async function addElements (user, { id, uris }) {
  return customAuthReq(user, 'post', '/api/lists?action=add-elements', { id, uris })
}
