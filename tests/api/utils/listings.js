import { isArray } from 'lodash-es'
import { getUser } from '#tests/api/utils/utils'
import { authReq } from '../utils/utils.js'
import { customAuthReq } from './request.js'

const endpoint = '/api/lists?action='
const byIds = 'by-ids'

const getByIds = async (user, ids, params = '') => {
  if (isArray(ids)) ids = ids.join('|')
  let promise
  const path = `${endpoint}${byIds}${params}&ids=${ids}`
  if (user) {
    promise = customAuthReq(user, 'get', path)
  } else {
    promise = authReq('get', path)
  }
  return promise
}

export async function getById ({ user, id, params }) {
  user = user || getUser()
  const { lists } = await getByIds(user, id, params)
  return lists[id]
}

export async function getByIdWithElements ({ user, id }) {
  return getById({ user, id, params: '&with-elements=true' })
}

export async function addElements (user, { id, uris }) {
  return customAuthReq(user, 'post', '/api/lists?action=add-elements', { id, uris })
}
