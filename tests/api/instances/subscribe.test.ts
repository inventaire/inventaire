import 'should'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/instances?action=subscribe'

describe('instances:subscribe', () => {
  it('should reject user requests', async () => {
    await authReq('post', endpoint, { event: 'revert-merge', uri: 'wd:Q1' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
    })
  })

  // Tested in tests/api/items/entity_changes.ts and tests/api/listings/uri_changes.ts when run in federated mode
  // it('should accept subscription from federated instances', async () => {})
})
