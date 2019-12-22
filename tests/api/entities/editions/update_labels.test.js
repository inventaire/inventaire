require('should')
const { undesiredRes } = require('../../utils/utils')
const { updateLabel } = require('../../utils/entities')
const { createEdition, randomLabel } = require('../../fixtures/entities')

describe('entities:editions:update-labels', () => {
  it('should reject labels update', done => {
    createEdition()
    .then(edition => {
      return updateLabel(edition._id, 'fr', randomLabel())
      .then(undesiredRes(done))
      .catch(err => {
        err.body.status_verbose.should.equal("editions can't have labels")
        err.statusCode.should.equal(400)
        done()
      })
    })
    .catch(done)
  })
})
