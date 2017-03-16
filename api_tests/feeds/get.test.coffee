CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, getUser } = __.require 'apiTests', 'utils/utils'

describe 'feeds:get', ->
  it 'should return a user RSS feed', (done)->
    getUser()
    .then (user)->
      userId = user._id
      nonAuthReq 'get', "/api/feeds?user=#{userId}"
      .then (res)->
        res.startsWith('<?xml').should.be.true()
        done()

    return

  it 'should return a user RSS feed', (done)->
    getUser()
    .then (user)->
      { _id:userId, readToken:token } = user
      nonAuthReq 'get', "/api/feeds?user=#{userId}&requester=#{userId}&token=#{token}"
      .then (res)->
        res.startsWith('<?xml').should.be.true()
        done()

    return
