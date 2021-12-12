require('should')
const { shouldNotBeCalled } = require('tests/api/utils/utils')
const { updateLabel } = require('tests/api/utils/entities')
const { createEdition, randomLabel } = require('tests/api/fixtures/entities')

describe('entities:editions:update-labels', () => {
  it('should reject labels update', async () => {
    const edition = await createEdition()
    await updateLabel(edition._id, 'fr', randomLabel())
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("editions can't have labels")
      err.statusCode.should.equal(400)
    })
  })
})
