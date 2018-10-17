CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'

describe 'notifications:get', ->
  it 'should get user notifications', (done)->
    authReq 'get', '/api/notifications'
    .then (res)->
      res.notifications.should.be.an.Array()
      done()
    .catch undesiredErr(done)

    return
