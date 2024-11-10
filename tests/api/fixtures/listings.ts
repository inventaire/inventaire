import { randomWords } from '#fixtures/text'
import type { AwaitableUserWithCookie } from '#fixtures/users'
import { addElements, getByIdWithElements } from '#tests/api/utils/listings'
import { customAuthReq } from '#tests/api/utils/request'
import { getUser } from '#tests/api/utils/utils'
import type { ListingElement } from '#types/element'
import type { EntityUri } from '#types/entity'
import type { Listing } from '#types/listing'
import type { VisibilityKey } from '#types/visibility'
import { createWork } from './entities.js'

const endpoint = '/api/lists?action='

export const listingName = () => randomWords(3, ' listing')
export const listingDescription = () => {
  return randomWords(3, ' listing')
}

export const createListing = async (userPromise?: AwaitableUserWithCookie, listingData: Partial<Listing> = {}) => {
  userPromise = userPromise || getUser()
  listingData.name = listingData.name || listingName()
  listingData.visibility = listingData.visibility || [ 'public' ]
  listingData.description = listingData.description || listingDescription()
  const user = await userPromise
  const { list: listing } = await customAuthReq(user, 'post', `${endpoint}create`, listingData)
  return {
    listing: listing as Listing,
    user,
  }
}

export async function updateListing (user: AwaitableUserWithCookie, listing: Listing) {
  const { _id, name, description, visibility } = listing
  await customAuthReq(user, 'put', endpoint, {
    id: _id,
    name,
    description,
    visibility,
  })
}

export async function createListingWithElements (userPromise?: AwaitableUserWithCookie, numberOfElements = 3) {
  userPromise = userPromise || getUser()
  const { listing, user } = await createListing(userPromise)
  const uris = []
  let i = 0
  while (i++ < numberOfElements) {
    const { uri } = await createElement({ listing }, userPromise)
    uris.push(uri)
  }
  const updatedListing = await getByIdWithElements({ user, id: listing._id })
  return { listing: updatedListing, user, uris }
}

export const createElement = async (params = {}, userPromise?: AwaitableUserWithCookie) => {
  const { visibility = [ 'public' ] }: { visibility?: VisibilityKey[] } = params
  let { uri, listing }: { uri?: EntityUri, listing?: Listing } = params
  userPromise = userPromise || getUser()
  if (!listing) {
    const fixtureListing = await createListing(userPromise, { visibility })
    listing = fixtureListing.listing
  }
  if (!uri) {
    const edition = await createWork()
    uri = edition.uri
  }
  const { createdElements } = await addElements(userPromise, {
    id: listing._id,
    uris: [ uri ],
  })
  return {
    element: createdElements[0] as ListingElement,
    listing,
    uri,
  }
}

export const removeElement = async ({ uri, listing }, user: AwaitableUserWithCookie) => {
  user = user || getUser()
  user = await (user || getUser())
  const removeElements = '/api/lists?action=remove-elements'

  return customAuthReq(user, 'post', removeElements, {
    id: listing._id,
    uris: [ uri ],
  })
}

export function updateElement (element: ListingElement, user: AwaitableUserWithCookie) {
  const { _id: id, comment, ordinal } = element
  return customAuthReq(user, 'post', '/api/lists?action=update-element', {
    id,
    comment,
    ordinal,
  })
}
