import 'should'
import { wait } from '#lib/promises'
import { getRandomString } from '#lib/utils/random_string'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { createUser, createUsername } from '../fixtures/users.js'
import { publicReq } from '../utils/utils.js'

const endpoint = '/api/auth?action=login'

describe('auth:login', () => {
  it('should login a user with a username and a password', async () => {
    const username = createUsername()
    const password = '12345678'
    await createUser({ username, password })
    await wait(10)
    const res = await publicReq('post', endpoint, { username, password })
    res.ok.should.be.true()
  })

  it('should login a user with a email and a password', async () => {
    const username = createUsername()
    const password = '12345678'
    const user = await createUser({ username, password })
    await wait(10)
    const res = await publicReq('post', endpoint, { username: user.email, password })
    res.ok.should.be.true()
  })

  it('should reject wrong password', async () => {
    const username = createUsername()
    const password = getRandomString(9)
    await createUser({ username, password })
    await wait(10)
    await publicReq('post', endpoint, { username, password: 'notthepassword' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
      // TODO serve better handled errors
      // err.body.status_verbose.should.equal('unauthorized user')
    })
  })

  it('should login a user with a non-normalized username', async () => {
    const nonNormalizedUnicodeLetter = '\u0065\u0301'
    const username = createUsername() + nonNormalizedUnicodeLetter
    const password = '12345678'
    await createUser({ username: username.normalize(), password })
    await wait(10)
    const res = await publicReq('post', endpoint, { username, password })
    res.ok.should.be.true()
  })
})
