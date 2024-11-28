import type { AwaitableUserWithCookie } from '#fixtures/users'
import { getUser } from '#tests/api/utils/utils'
import type { RelativeUrl } from '#types/common'
import type { ListingId } from '#types/listing'
import { customAuthReq } from './request.js'

const endpoint = '/api/lists?action='
const byId = 'by-id'

interface GetListingByIdParams {
  user?: AwaitableUserWithCookie
  id: ListingId
}

export async function getListingById ({ user, id }: GetListingByIdParams) {
  user = user || getUser()
  const path: RelativeUrl = `${endpoint}${byId}&id=${id}`
  const { list: listing } = await customAuthReq(user, 'get', path)
  return listing
}

export async function getByIdWithElements ({ user, id }: GetListingByIdParams) {
  return getListingById({ user, id })
}

export async function addElements (user, { id, uris }) {
  return customAuthReq(user, 'post', '/api/lists?action=add-elements', { id, uris })
}
