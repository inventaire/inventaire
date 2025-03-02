import type { AwaitableUserWithCookie } from '#fixtures/users'
import { getUser } from '#tests/api/utils/utils'
import type { RelativeUrl } from '#types/common'
import type { ListingElementId } from '#types/element'
import type { ListingId } from '#types/listing'
import { customAuthReq } from './request.js'

interface GetListingByIdParams {
  user?: AwaitableUserWithCookie
  id: ListingId
}

export async function getListingById ({ user, id }: GetListingByIdParams) {
  user ??= getUser()
  const path: RelativeUrl = `/api/lists?action=by-id&id=${id}`
  const { list: listing } = await customAuthReq(user, 'get', path)
  return listing
}

export async function getByIdWithElements ({ user, id }: GetListingByIdParams) {
  return getListingById({ user, id })
}

export async function addElements (user, { id, uris }) {
  return customAuthReq(user, 'post', '/api/lists?action=add-elements', { id, uris })
}

interface GetListingElementByIdParams {
  user?: AwaitableUserWithCookie
  id: ListingElementId
}

export async function getListingElementById ({ user, id }: GetListingElementByIdParams) {
  user ??= getUser()
  const path: RelativeUrl = `/api/lists?action=by-element-id&id=${id}`
  const { element, list: listing } = await customAuthReq(user, 'get', path)
  return { element, listing }
}
