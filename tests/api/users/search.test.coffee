CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq, customAuthReq, getUser, getUserB, undesiredErr } = require '../utils/utils'
{ createUser } = require '../fixtures/users'

describe 'users:search', ->
  it 'should find a user', (done)->
    getUser()
    .delay 1000
    .then (user)->
      { username } = user
      nonAuthReq 'get', "/api/users?action=search&search=#{username}"
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should find a user even with just a prefix', (done)->
    getUser()
    .delay 1000
    .then (user)->
      prefix = user.username[0..4]
      nonAuthReq 'get', "/api/users?action=search&search=#{prefix}"
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should find a user even with a typo', (done)->
    # Using a user with a non-random username to make the typo not to hard
    # to recover for ElasticSearch
    userPromise = createUser { username: 'testuser' }
    userPromise
    .delay 1000
    .then (user)->
      customAuthReq userPromise, 'get', '/api/users?action=search&search=testusr'
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should not return snapshot data', (done)->
    getUserB()
    .delay 1000
    .then (user)->
      authReq 'get', "/api/users?action=search&search=#{user.username}"
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        should(res.users[0].snapshot).not.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should find a user by its bio', (done)->
    authReq 'put', '/api/user', { attribute: 'bio', value: 'blablablayouhou' }
    .catch (err)->
      if err.body.status_verbose is 'already up-to-date' then return
      else throw err
    .then getUser
    .delay 1000
    .then (user)->
      nonAuthReq 'get', "/api/users?action=search&search=#{user.bio}"
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        done()
    .catch undesiredErr(done)

    return

usersIds = (res)-> _.map res.users, '_id'
