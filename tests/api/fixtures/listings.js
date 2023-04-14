import { randomWords } from '#fixtures/text'
import { addElements } from '#tests/api/utils/listings'
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
  const res = await addElements(userPromise, {
    id: listing._id,
    uris: [ uri ],
  })
  const { createdElements } = res
  return {
    element: createdElements[0],
    listing,
    uri,
  }
}
