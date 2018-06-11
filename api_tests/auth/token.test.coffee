CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredRes, getUser } = require '../utils/utils'
randomString = __.require 'lib', './utils/random_string'
breq = require 'bluereq'
host = CONFIG.fullHost()

describe 'token:reset-password', ->
  it 'should reject requests without email', (done)->
    nonAuthReq 'get', '/api/token?action=reset-password'
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.equal 'missing parameter in query: email'
      done()
    .catch done

    return

describe 'token:validation-email', ->
  it 'should reject requests without email', (done)->
    breq.get
      url: "#{host}/api/token?action=validation-email"
      followRedirect: false
    .then (res)->
      res.headers.location.should.equal '/?validEmail=false'
      done()
    .catch done

    return
