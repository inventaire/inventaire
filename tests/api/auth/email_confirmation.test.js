const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { customAuthReq, getUserGetter, shouldNotBeCalled } = require('../utils/utils')
const endpoint = '/api/auth?action=email-confirmation'
const { createUserEmail } = require('../fixtures/users')
const { BasicUpdater } = require('lib/doc_updates')
const db = require('db/couchdb/base')('users')

describe('auth:email-confirmation', () => {
  it('should send a confirmation if email is not validated ', async () => {
    const email = createUserEmail()
    const user = await getUserGetter(email)()
    user.validEmail.should.be.false()
    const res = await customAuthReq(user, 'post', endpoint, { email })
    res.ok.should.be.true()
  })

  it('should reject if email is already valid ', async () => {
    const email = createUserEmail()
    const user = await getUserGetter(email)()
    await setCustomUserAttribute(user, 'validEmail', true)
    await customAuthReq(user, 'post', endpoint, { email })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('email was already validated')
    })
  })

  it('should reject if creation strategy is not local ', async () => {
    const email = createUserEmail()
    const user = await getUserGetter(email)()
    await setCustomUserAttribute(user, 'creationStrategy', 'notLocal')
    await customAuthReq(user, 'post', endpoint, { email })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('wrong authentification creationStrategy')
    })
  })
})

const setCustomUserAttribute = async (user, userAttribute, value) => {
  await db.update(user._id, BasicUpdater(userAttribute, value))
  return user
}
