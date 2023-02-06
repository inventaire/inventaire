import 'should'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createEdition, createCollection } from '../../fixtures/entities.js'
import { addClaim, removeClaim } from '../../utils/entities.js'

describe('entities:create:collections', () => {
  it('should create a collection', async () => {
    const collectionDoc = await createCollection()
    collectionDoc.type.should.equal('collection')
  })

  it('should reject a collection without a publisher', async () => {
    const { uri: collectionUri, claims } = await createCollection()
    const publisherUri = claims['wdt:P123'][0]
    try {
      await removeClaim({ uri: collectionUri, property: 'wdt:P123', value: publisherUri }).then(shouldNotBeCalled)
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
      await removeClaim({ uri: collectionUri, property: 'wdt:P1476', value: title }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('a collection should have a title (wdt:P1476)')
    }
  })

  it('should update an edition claim with a local collection entity', async () => {
    const { uri: editionUri } = await createEdition()
    const { uri: collectionUri } = await createCollection()
    const res = await addClaim({ uri: editionUri, property: 'wdt:P195', value: collectionUri })
    res.ok.should.be.true()
  })
})
