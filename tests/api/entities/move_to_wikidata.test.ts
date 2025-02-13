import 'should'
import { createWork, getRandomInvUri } from '#fixtures/entities'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/entities?action=move-to-wikidata'

describe('entities:move-to-wikidata', () => {
  it('should reject without uri', async () => {
    await authReq('put', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: uri')
    })
  })

  it('should reject if entity does not exist', async () => {
    const uri = getRandomInvUri()
    await authReq('put', endpoint, { uri })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('entity not found')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject without oauth tokens', async () => {
    // as test environment should not have any tokens
    const work = await createWork()
    await authReq('put', endpoint, { uri: work.uri })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing wikidata oauth tokens')
      err.statusCode.should.equal(400)
    })
  })
})
