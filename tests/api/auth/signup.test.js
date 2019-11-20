
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { nonAuthReq, undesiredRes } = require('../utils/utils')
const endpoint = '/api/auth?action=signup'
const randomString = __.require('lib', './utils/random_string')

describe('auth:signup', () => {
  it('should reject requests without username', done => {
    nonAuthReq('post', endpoint, {})
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: username')
      done()
    })
    .catch(done)
  })

  it('should reject requests without email', done => {
    nonAuthReq('post', endpoint, { username: randomString(4) })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: email')
      done()
    })
    .catch(done)
  })

  it('should reject requests without password', done => {
    nonAuthReq('post', endpoint, {
      username: randomString(4),
      email: `bla${randomString(4)}@foo.bar`
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: password')
      done()
    })
    .catch(done)
  })

  it('should create a user', done => {
    nonAuthReq('post', endpoint, {
      username: randomString(4),
      email: `bla${randomString(4)}@foo.bar`,
      password: randomString(8)
    })
    .then(res => {
      res.ok.should.be.true()
      done()
    })
    .catch(done)
  })
})
