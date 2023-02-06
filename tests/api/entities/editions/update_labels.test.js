import 'should'
import { createEdition, randomLabel } from '#fixtures/entities'
import { updateLabel } from '#tests/api/utils/entities'
import { shouldNotBeCalled } from '#tests/unit/utils'

describe('entities:editions:update-labels', () => {
  it('should reject labels update', async () => {
    const edition = await createEdition()
    await updateLabel({ uri: edition._id, lang: 'fr', value: randomLabel() })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("editions can't have labels")
      err.statusCode.should.equal(400)
    })
  })
})
