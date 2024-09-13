import 'should'
import dbFactory from '#db/couchdb/base'
import { createUser } from '#fixtures/users'
import { BasicUpdater } from '#lib/doc_updates'
import { wait } from '#lib/promises'
import { getRandomString } from '#lib/utils/random_string'
import { customAuthReq } from '#tests/api/utils/request'
import { authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const endpoint = '/api/auth?action=update-password'
const db = await dbFactory('users')

describe('auth:update-password', () => {
  it('should reject short new password', async () => {
    await authReq('post', endpoint, {
      'new-password': getRandomString(7),
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid new-password')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject short old password', async () => {
    await authReq('post', endpoint, {
      'current-password': getRandomString(7),
      'new-password': getRandomString(20),
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid current-password')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject if current password is incorrect', async () => {
    await authReq('post', endpoint, {
      'current-password': getRandomString(20),
      'new-password': getRandomString(20),
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid current-password')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject if reset password timestamp is invalid', async () => {
    const user = await createUser()
    await updateCustomUser(user, 'resetPassword', 'invalid')
    await customAuthReq(user, 'post', endpoint, {
      'new-password': getRandomString(20),
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('invalid resetPassword timestamp')
      err.statusCode.should.equal(500)
    })
  })

  it('should reject if reset password timestamp is too old', async () => {
    const user = await createUser()
    await updateCustomUser(user, 'resetPassword', 1000)
    await customAuthReq(user, 'post', endpoint, {
      'new-password': getRandomString(20),
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('reset password timespan experied')
      err.statusCode.should.equal(400)
    })
  })

  it('should reset password timestamp is recent', async () => {
    const user = await createUser()
    const recentTime = Date.now() - 1000
    await updateCustomUser(user, 'resetPassword', recentTime)
    await customAuthReq(user, 'post', endpoint, {
      'new-password': getRandomString(20),
    })
  })

  it('should update the password', async () => {
    const password = getRandomString(20)
    const newPassword = getRandomString(20)
    const newPassword2 = getRandomString(20)
    const user = await createUser({ password })
    await customAuthReq(user, 'post', endpoint, {
      'current-password': password,
      'new-password': newPassword,
    })
    await customAuthReq(user, 'post', endpoint, {
      'current-password': newPassword,
      'new-password': newPassword2,
    })
  })
})

const updateCustomUser = async (userPromise, userAttribute, value) => {
  const user = await userPromise
  await db.update(user._id, BasicUpdater(userAttribute, value))
  await wait(100)
}
