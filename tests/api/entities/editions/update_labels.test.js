import 'should'
import { shouldNotBeCalled } from 'tests/api/utils/utils'
import { updateLabel } from 'tests/api/utils/entities'
import { createEdition, randomLabel } from 'tests/api/fixtures/entities'

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
