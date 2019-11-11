CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredRes } = require '../utils/utils'
endpoint = '/api/auth?action=signup'
randomString = __.require 'lib', './utils/random_string'

describe 'auth:signup', ->
  it 'should reject requests without username', (done)->
    nonAuthReq 'post', endpoint, {}
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.equal 'missing parameter in body: username'
      done()
    .catch done

    return

  it 'should reject requests without email', (done)->
    nonAuthReq 'post', endpoint, { username: randomString(4) }
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.equal 'missing parameter in body: email'
      done()
    .catch done

    return

  it 'should reject requests without password', (done)->
    nonAuthReq 'post', endpoint,
      username: randomString 4
      email: "bla#{randomString(4)}@foo.bar"
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.equal 'missing parameter in body: password'
      done()
    .catch done

    return

  it 'should create a user', (done)->
    nonAuthReq 'post', endpoint,
      username: randomString 4
      email: "bla#{randomString(4)}@foo.bar"
      password: randomString 8
    .then (res)->
      res.ok.should.be.true()
      done()
    .catch done

    return
