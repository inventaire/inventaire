require('should')
const { authReq, customAuthReq, getUser, getUserGetter } = require('../utils/utils')
const randomString = require('lib/utils/random_string')
const { wait } = require('lib/promises')
const endpoint = '/api/auth?action=update-password'
const { createUser, createUserEmail } = require('../fixtures/users')
const { BasicUpdater } = require('lib/doc_updates')
const { shouldNotBeCalled } = require('root/tests/unit/utils')
const db = require('db/couchdb/base')('users')

describe('auth:update-password', () => {
  it('should reject short new password', async () => {
    const user = await getUser()
    await authReq('post', endpoint, {
      email: user.email,
      'new-password': randomString(7)
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid new-password')
    })
  })

  it('should reject short old password', async () => {
    await authReq('post', endpoint, {
      email: createUserEmail(),
      'new-password': randomString(20),
      'current-password': randomString(7)
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid current-password')
    })
  })

  it('should reject if current password is incorrect', async () => {
    const user = await createUser()
    await authReq('post', endpoint, {
      email: user.email,
      'current-password': randomString(20),
      'new-password': randomString(20)
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid current-password')
    })
  })

  it('should reject if reset password timestamp is invalid', async () => {
    const email = createUserEmail()
    const userPromise = getUserGetter(email)()
    await updateCustomUser(userPromise, 'resetPassword', 'invalid')
    await customAuthReq(userPromise, 'post', endpoint, {
      email,
      'new-password': randomString(20)
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('invalid resetPassword timestamp')
    })
  })

  it('should reject if reset password timestamp is too old', async () => {
    const email = createUserEmail()
    const userPromise = getUserGetter(email)()
    await updateCustomUser(userPromise, 'resetPassword', 1000)
    await customAuthReq(userPromise, 'post', endpoint, {
      email,
      'new-password': randomString(20)
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('reset password timespan experied')
    })
  })

  it('should reset password timestamp is recent', async () => {
    const email = createUserEmail()
    const userPromise = getUserGetter(email)()
    const recentTime = Date.now() - 1000
    await updateCustomUser(userPromise, 'resetPassword', recentTime)
    const res = await customAuthReq(userPromise, 'post', endpoint, {
      email,
      'new-password': randomString(20)
    })
    res.ok.should.be.true()
  })
})

const updateCustomUser = async (userPromise, userAttribute, value) => {
  const user = await userPromise
  await db.update(user._id, BasicUpdater(userAttribute, value))
  await wait(100)
}
