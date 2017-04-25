CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, getUser, undesiredErr } = __.require 'apiTests', 'utils/utils'

describe 'users:by-usernames', ->
  it 'should get a user', (done)->
    getUser()
    .delay 10
    .then (user)->
      { username } = user
      nonAuthReq 'get', "/api/users?action=by-usernames&usernames=#{username}"
      .then (res)->
        res.users.should.be.an.Object()
        res.users[username].should.be.an.Object()
        res.users[username].username.should.equal username
        done()
    .catch undesiredErr(done)

    return
