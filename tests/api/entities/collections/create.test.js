require('should')
const { createEdition, createCollection } = require('../../fixtures/entities')
const { updateClaim, removeClaim } = require('../../utils/entities')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../../utils/utils')

describe('entities:create:collections', () => {
  it('should create a collection', async () => {
    const collectionDoc = await createCollection()
    collectionDoc.type.should.equal('collection')
  })

  it('should reject a collection without a publisher', async () => {
    const { uri: collectionUri, claims } = await createCollection()
    const publisherUri = claims['wdt:P123'][0]
    try {
      await removeClaim(collectionUri, 'wdt:P123', publisherUri).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('a collection should have a publisher (wdt:P123)')
    }
  })

  it('should reject a collection without a title', async () => {
    const { uri: collectionUri, claims } = await createCollection()
    const title = claims['wdt:P1476'][0]
    try {
      await removeClaim(collectionUri, 'wdt:P1476', title).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('a collection should have a title (wdt:P1476)')
    }
  })

  it('should update an edition claim with a local collection entity', async () => {
    const { uri: editionUri } = await createEdition()
    const { uri: collectionUri } = await createCollection()
    const res = await updateClaim(editionUri, 'wdt:P195', null, collectionUri)
    res.ok.should.be.true()
  })
})
