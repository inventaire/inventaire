const fakeText = require('./text')
const { customAuthReq } = require('../utils/request')
const { getUser } = require('../utils/utils')
const { createEdition } = require('./entities')
const { addElements } = require('tests/api/utils/listings')
const endpoint = '/api/lists?action='

const fixtures = module.exports = {
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
      uris: [ uri ]
    })
    const { createdElements } = res
    return {
      element: createdElements[0],
      listing,
      uri
    }
  }
}
