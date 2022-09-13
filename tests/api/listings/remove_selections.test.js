const { getUserB, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { authReq } = require('../utils/utils')
const { createListing, createSelection } = require('../fixtures/listings')

const endpoint = '/api/lists?action='
const removeSelections = `${endpoint}remove-selections`

const selections_ = require('controllers/listings/lib/selections')
const listings_ = require('controllers/listings/lib/listings')

describe('listings:remove-selections', () => {
  it('should reject without listing id', async () => {
    try {
      await authReq('post', removeSelections).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without uris', async () => {
    const { listing } = await createListing()
    try {
      await authReq('post', removeSelections, {
        id: listing._id
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: uris')
      err.statusCode.should.equal(400)
    }
  })

  it('should throw if no uris are found in listing', async () => {
    const { listing } = await createListing()
    const { uri } = await createSelection({})
    await authReq('post', removeSelections, {
      id: listing._id,
      uris: [ uri ]
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
      err.body.status_verbose.should.equal('not found')
    })
  })

  it('should set warnings when some uris are not found', async () => {
    const { listing, uri } = await createSelection({})
    const { uri: uri2 } = await createSelection({})
    const randomUnkownUri = 'inv:a78c6d212de6be6f4aa29741933d276f'
    const res = await authReq('post', removeSelections, {
      id: listing._id,
      uris: [ uri, uri2, randomUnkownUri ]
    })
    const warning = res.warnings[0]
    warning.should.startWith('entities uris not found')
    warning.should.containEql(uri2)
    warning.should.containEql(randomUnkownUri)
  })

  it('should reject removing selections of a different user listing', async () => {
    try {
      const { listing, uri } = await createSelection({}, getUserB())
      await authReq('post', removeSelections, {
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

  it('should remove from listing a selection by its entity uris and delete the selection', async () => {
    const { listing, uri, selection } = await createSelection({})
    const resListing = await listings_.byIdsWithSelections(listing._id, listing.user)
    resListing[0].selections.length.should.equal(1)
    await authReq('post', removeSelections, {
      id: listing._id,
      uris: [ uri ]
    })

    await selections_.byId(selection._id)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
      err.body.reason.should.equal('deleted')
    })

    await listings_.byIdsWithSelections(listing._id, listing.user)
    .then(lists => lists[0].selections.length.should.equal(0))
  })
})
