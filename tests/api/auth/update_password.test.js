require('should')
const { authReq, customAuthReq, getReservedUser } = require('../utils/utils')
const randomString = require('lib/utils/random_string')
const { wait } = require('lib/promises')
const endpoint = '/api/auth?action=update-password'
const { BasicUpdater } = require('lib/doc_updates')
const { shouldNotBeCalled } = require('root/tests/unit/utils')
const db = require('db/couchdb/base')('users')

describe('auth:update-password', () => {
  it('should reject short new password', async () => {
    await authReq('post', endpoint, {
      'new-password': randomString(7)
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid new-password')
    })
  })

  it('should reject short old password', async () => {
    await authReq('post', endpoint, {
      'current-password': randomString(7),
      'new-password': randomString(20),
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid current-password')
    })
  })

  it('should reject if current password is incorrect', async () => {
    await authReq('post', endpoint, {
      'current-password': randomString(20),
      'new-password': randomString(20),
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid current-password')
    })
  })

  it('should reject if reset password timestamp is invalid', async () => {
    const user = await getReservedUser()
    await updateCustomUser(user, 'resetPassword', 'invalid')
    await customAuthReq(user, 'post', endpoint, {
      'new-password': randomString(20)
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('invalid resetPassword timestamp')
    })
  })

  it('should reject if reset password timestamp is too old', async () => {
    const user = await getReservedUser()
    await updateCustomUser(user, 'resetPassword', 1000)
    await customAuthReq(user, 'post', endpoint, {
      'new-password': randomString(20)
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('reset password timespan experied')
    })
  })

  it('should reset password timestamp is recent', async () => {
    const user = await getReservedUser()
    const recentTime = Date.now() - 1000
    await updateCustomUser(user, 'resetPassword', recentTime)
    await customAuthReq(user, 'post', endpoint, {
      'new-password': randomString(20)
    })
  })

  it('should update the password', async () => {
    const password = randomString(20)
    const newPassword = randomString(20)
    const newPassword2 = randomString(20)
    const user = await getReservedUser({ password })
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
