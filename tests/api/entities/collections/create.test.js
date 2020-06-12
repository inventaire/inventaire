require('should')
const { createEdition, createCollection } = require('../../fixtures/entities')
const { updateClaim } = require('../../utils/entities')

describe('entities:create:collections', () => {
  it('should create a local collection entity', async () => {
    const collectionDoc = await createCollection()
    collectionDoc.type.should.equal('collection')
  })

  it('should update an edition claim with a local collection entity', async () => {
    const { uri: editionUri } = await createEdition()
    const { uri: collectionUri } = await createCollection()
    const res = await updateClaim(editionUri, 'wdt:P195', null, collectionUri)
    res.ok.should.be.true()
  })
})
