CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, getUser, undesiredErr } = __.require 'apiTests', 'utils/utils'

describe 'users:by-ids', ->
  it 'should get a user', (done)->
    getUser()
    .then (user)->
      userId = user._id
      nonAuthReq 'get', "/api/users?action=by-ids&ids=#{userId}"
      .then (res)->
        res.users.should.be.an.Object()
        res.users[userId].should.be.an.Object()
        res.users[userId]._id.should.equal userId
        done()
    .catch undesiredErr(done)

    return
