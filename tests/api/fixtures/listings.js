const fakeText = require('./text')
const { customAuthReq } = require('../utils/request')
const { getUser } = require('../utils/utils')
const { createEdition } = require('./entities')

const endpoint = '/api/lists?action='
const selections_ = require('controllers/listings/lib/selections')

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

  createSelection: async ({ visibility = [ 'public' ], uri, listing }, userPromise) => {
    const selectionData = {}
    let userId
    if (!listing) {
      const fixtureListing = await fixtures.createListing(userPromise, { visibility })
      listing = fixtureListing.listing
      userId = fixtureListing.user._id
    } else {
      userId = listing.creator
    }
    selectionData.listing = listing

    if (!uri) {
      const edition = await createEdition()
      uri = edition.uri
    }
    selectionData.uris = [ uri ]

    selectionData.userId = userId
    const { docs } = await selections_.create(selectionData)
    return {
      selection: docs[0],
      listing,
      uri
    }
  }
}
