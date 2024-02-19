import { randomWords } from '#fixtures/text'
import { addElements, getByIdWithElements } from '#tests/api/utils/listings'
import { customAuthReq } from '#tests/api/utils/request'
import { getUser } from '../utils/utils.js'
import { createWork } from './entities.js'

const endpoint = '/api/lists?action='

export const listingName = () => randomWords(3, ' listing')
export const listingDescription = () => {
  return randomWords(3, ' listing')
}

export const createListing = async (userPromise, listingData = {}) => {
  userPromise = userPromise || getUser()
  listingData.name = listingData.name || listingName()
  listingData.visibility = listingData.visibility || [ 'public' ]
  listingData.description = listingData.description || listingDescription()
  const user = await userPromise
  const { list: listing } = await customAuthReq(user, 'post', `${endpoint}create`, listingData)
  return { listing, user }
}

export async function createListingWithElements (userPromise) {
  userPromise = userPromise || getUser()
  const { listing, user } = await createListing(userPromise)
  const { uri: uri2 } = await createElement({ listing }, userPromise)
  const { uri } = await createElement({ listing }, userPromise)
  const updatedListing = await getByIdWithElements({ user, id: listing._id })
  return { listing: updatedListing, user, uris: [ uri, uri2 ] }
}

export const createElement = async ({ visibility = [ 'public' ], uri, listing }, userPromise) => {
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
