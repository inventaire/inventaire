const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { customAuthReq, getUserGetter } = require('../utils/utils')
const { Wait } = __.require('lib', 'promises')
const endpoint = '/api/auth?action=email-confirmation'
const { createUserEmail } = require('../fixtures/users')
const { BasicUpdater } = __.require('lib', 'doc_updates')
const db = __.require('couch', 'base')('users')

describe('auth:email-confirmation', () => {
  it('should send a confirmation if email is not validated ', done => {
    const email = createUserEmail()
    const userPromise = getUserGetter(email, false)()
    userPromise
    .then(user => {
      user.validEmail.should.be.false()
      return customAuthReq(userPromise, 'post', endpoint, { email })
    })
    .then(res => {
      res.ok.should.be.true()
      done()
    })
    .catch(done)
  })

  it('should reject if email is already valid ', done => {
    const email = createUserEmail()
    const userPromise = getUserGetter(email, false)()
    createCustomUser(userPromise, 'validEmail', true)
    .then(() => customAuthReq(userPromise, 'post', endpoint, { email }))
    .catch(err => {
      err.body.status_verbose.should.equal('email was already validated')
      done()
    })
    .catch(done)
  })

  it('should reject if creation strategy is not local ', done => {
    const email = createUserEmail()
    const userPromise = getUserGetter(email, false)()
    createCustomUser(userPromise, 'creationStrategy', 'notLocal')
    .then(() => customAuthReq(userPromise, 'post', endpoint, { email }))
    .catch(err => {
      err.body.status_verbose.should.equal('wrong authentification creationStrategy')
      done()
    })
    .catch(done)
  })
})

const createCustomUser = (userPromise, userAttribute, value) => {
  return userPromise
  .then(user => {
    db.update(user._id, BasicUpdater(userAttribute, value))
    return user
  })
  .then(Wait(100))
}
