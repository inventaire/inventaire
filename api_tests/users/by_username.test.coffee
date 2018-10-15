CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, getUser, undesiredErr } = require '../utils/utils'
{ createUser } = require '../fixtures/users'
randomString = __.require 'lib', './utils/random_string'

describe 'users:by-usernames', ->
  it 'should get a user with a non lowercase username', (done)->
    username = 'notAllLowerCase' + randomString(4)
    lowerCasedUsername = username.toLowerCase()
    createUser { username }
    .delay 10
    .then (user)->
      { username } = user
      nonAuthReq 'get', "/api/users?action=by-usernames&usernames=#{username}"
      .then (res)->
        { users } = res
        users.should.be.an.Object()
        should(users[username]).not.be.ok()
        users[lowerCasedUsername].should.be.an.Object()
        users[lowerCasedUsername].username.should.equal username
        done()
    .catch undesiredErr(done)

    return
