CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredRes, getUser } = require '../utils/utils'
endpoint = '/api/auth?action=reset-password'
randomString = __.require 'lib', './utils/random_string'

describe 'auth:reset-password', ->
  it 'should reject requests without email', (done)->
    nonAuthReq 'post', endpoint, {}
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.equal 'missing parameter in body: email'
      done()
    .catch done

    return

  it 'should send a reset password email', (done)->
    getUser()
    .then (user)-> nonAuthReq 'post', endpoint, { email: user.email }
    .then (res)->
      res.ok.should.be.true()
      done()
    .catch done

    return
