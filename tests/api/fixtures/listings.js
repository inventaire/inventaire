import { addElements } from '#tests/api/utils/listings'
import { customAuthReq } from '../utils/request.js'
import { getUser } from '../utils/utils.js'
import { createEdition } from './entities.js'
import fakeText from './text.js'

const endpoint = '/api/lists?action='

const fixtures = {
  listingName: () => fakeText.randomWords(3, ' listing'),
  listingDescription: () => {
    return fakeText.randomWords(3, ' listing')
  },

  createListing: async (userPromise, listingData = {}) => {
    userPromise = userPromise || getUser()
    listingData.name = listingData.name || fixtures.listingName()
    listingData.visibility = listingData.visibility || [ 'public' ]
    listingData.description = listingData.description || fixtures.listingDescription()
    const user = await userPromise
    const { list: listing } = await customAuthReq(user, 'post', `${endpoint}create`, listingData)
    return { listing, user }
  },

  createElement: async ({ visibility = [ 'public' ], uri, listing }, userPromise) => {
    userPromise = userPromise || getUser()
    if (!listing) {
      const fixtureListing = await fixtures.createListing(userPromise, { visibility })
      listing = fixtureListing.listing
    }
    if (!uri) {
      const edition = await createEdition()
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
  },
}
export default fixtures
