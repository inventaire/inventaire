import 'should'
import { createUserEmail } from '#fixtures/users'
import { getRandomString } from '#lib/utils/random_string'
import config from '#server/config'
import { rawRequest } from '#tests/api/utils/request'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const origin = config.getPublicOrigin()
const endpoint = '/api/token?action=reset-password'

describe('token:reset-password', () => {
  it('should reject requests without email', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: email')
    })
  })

  it('should reject requests without token', async () => {
    const email = createUserEmail()
    await publicReq('get', `${endpoint}&email=${email}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: token')
    })
  })

  it('should reject requests with too short token', async () => {
    const email = createUserEmail()
    const token = getRandomString(31)

    await publicReq('get', `${endpoint}&email=${email}&token=${token}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid token length')
    })
  })

  it('should reject random token', async () => {
    const email = createUserEmail()
    const token = getRandomString(32)
    const { headers } = await rawRequest('get', `${endpoint}&email=${email}&token=${token}`)
    headers.location.should.equal(`${origin}/login/forgot-password?resetPasswordFail=true`)
  })

  it('should reject HEAD requests', async () => {
    const email = createUserEmail()
    const token = getRandomString(32)
    await rawRequest('head', `${endpoint}&email=${email}&token=${token}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      // The body content can not be tested as its a HEAD request
      // err.body.status_verbose.should.equal('wrong http method')
    })
  })
})
