const { getUserB, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { authReq } = require('../utils/utils')
const { createListing, createElement } = require('../fixtures/listings')
const { createEdition, someFakeUri } = require('../fixtures/entities')

const endpoint = '/api/lists?action='
const byIds = `${endpoint}by-ids&with-elements=true`

describe('listings:add-elements', () => {
  it('should reject without listing id', async () => {
    try {
      await authReq('post', `${endpoint}add-elements`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without uri', async () => {
    const { listing } = await createListing()
    try {
      await authReq('post', `${endpoint}add-elements`, {
        id: listing._id
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: uris')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject creating an element with an unknown entity', async () => {
    const { listing } = await createListing()
    await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: [ someFakeUri ]
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal('entities not found')
    })
    const res = await authReq('get', `${byIds}&ids=${listing._id}`)
    const firstListing = res.lists[listing._id]
    firstListing.elements.length.should.equal(0)
  })

  it('should add uri and create element', async () => {
    const { listing } = await createListing()
    const { uri } = await createEdition()
    await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: [ uri ]
    })
    const res = await authReq('get', `${byIds}&ids=${listing._id}`)
    const firstListing = res.lists[listing._id]
    firstListing.elements[0].uri.should.equal(uri)
  })

  it('should not add twice an element already in listing', async () => {
    const { listing, uri } = await createElement({})

    const res = await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: [ uri ]
    })
    res.ok.should.be.true()
    res.alreadyInList[0].uri.should.equal(uri)

    const { lists: listings } = await authReq('get', `${byIds}&ids=${listing._id}`)
    const firstListing = listings[listing._id]
    firstListing.elements.length.should.equal(1)
    firstListing.elements[0].uri.should.equal(uri)
  })

  it('should reject adding an element to a listing of another creator', async () => {
    try {
      const { listing } = await createListing(getUserB())
      const { uri } = await createEdition()
      await authReq('post', `${endpoint}add-elements`, {
        id: listing._id,
        uris: [ uri ]
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong user')
      err.statusCode.should.equal(403)
    }
  })
})
