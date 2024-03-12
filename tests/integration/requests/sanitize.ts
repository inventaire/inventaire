import { requests_ } from '#lib/requests'
import CONFIG from '#server/config'
import { shouldNotBeCalled } from '#tests/unit/utils'

describe('requests:sanitize', () => {
  it('should reject private URLs', async () => {
    await requests_.get(CONFIG.elasticsearch.origin, { sanitize: true })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.error_name.should.equal('invalid_url')
    })
  })
})
