require('should')
const { createEdition, createPublisher } = require('../../fixtures/entities')
const { updateClaim } = require('../../utils/entities')
const { undesiredErr } = require('../../utils/utils')

describe('entities:publishers:create', () => {
  it('should create a local publisher entity', done => {
    createPublisher()
    .then(publisherDoc => {
      publisherDoc.type.should.equal('publisher')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should update an edition claim with a local publisher entity', done => {
    createEdition()
    .then(edition => {
      const editionUri = `inv:${edition._id}`
      return createPublisher()
      .then(publisher => {
        const oldVal = null
        const newVal = `inv:${publisher._id}`
        const property = 'wdt:P123'
        return updateClaim(editionUri, property, oldVal, newVal)
        .then(res => done())
      })
    })
    .catch(undesiredErr(done))
  })
})
