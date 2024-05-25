import { randomWords } from '#fixtures/text'
import type { AwaitableUserWithCookie } from '#fixtures/users'
import type { EntityUri } from '#server/types/entity'
import type { Listing } from '#server/types/listing'
import type { VisibilityKey } from '#server/types/visibility'
import { addElements, getByIdWithElements } from '#tests/api/utils/listings'
import { customAuthReq } from '#tests/api/utils/request'
import { getUser } from '#tests/api/utils/utils'
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
  return { listing, user }
}

export async function createListingWithElements (userPromise?: AwaitableUserWithCookie) {
  userPromise = userPromise || getUser()
  const { listing, user } = await createListing(userPromise)
  const { uri } = await createElement({ listing }, userPromise)
  const { uri: uri2 } = await createElement({ listing }, userPromise)
  const { uri: uri3 } = await createElement({ listing }, userPromise)
  const updatedListing = await getByIdWithElements({ user, id: listing._id })
  return { listing: updatedListing, user, uris: [ uri, uri2, uri3 ] }
}

export const createElement = async ({ visibility = [ 'public' ], uri, listing }: { visibility?: VisibilityKey[], uri?: EntityUri, listing?: Listing }, userPromise?: AwaitableUserWithCookie) => {
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
    element: createdElements[0],
    listing,
    uri,
  }
}

export const removeElement = async ({ uri, listing }, userPromise) => {
  userPromise = userPromise || getUser()
  const user = await userPromise
  const removeElements = '/api/lists?action=remove-elements'

  return customAuthReq(user, 'post', removeElements, {
    id: listing._id,
    uris: [ uri ],
  })
}
