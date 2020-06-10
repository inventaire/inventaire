require('should')
const { createEdition, createPublisher } = require('../../fixtures/entities')
const { updateClaim } = require('../../utils/entities')

describe('entities:create:publishers', () => {
  it('should create a local publisher entity', async () => {
    const publisherDoc = await createPublisher()
    publisherDoc.type.should.equal('publisher')
  })

  it('should update an edition claim with a local publisher entity', async () => {
    const edition = await createEdition()
    const editionUri = `inv:${edition._id}`
    const publisher = await createPublisher()
    const oldVal = null
    const newVal = `inv:${publisher._id}`
    const property = 'wdt:P123'
    const res = await updateClaim(editionUri, property, oldVal, newVal)
    res.ok.should.be.true()
  })
})
