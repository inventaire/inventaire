import 'should'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/instances?action=event'

describe('instances:event', () => {
  it('should reject user requests', async () => {
    await authReq('post', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  // it('should accept an event from the primary instance', async () => {})
})
