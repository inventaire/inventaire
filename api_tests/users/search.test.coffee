CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, authReq, getUser, getUserB } = __.require 'apiTests', 'utils/utils'

describe 'users:search', ->
  it 'should find a user', (done)->
    getUser()
    .then (user)->
      userId = user._id
      nonAuthReq 'get', "/api/users?action=search&search=testuser"
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        done()

    return

  it 'should find a user even with just a prefix', (done)->
    getUser()
    .then (user)->
      userId = user._id
      nonAuthReq 'get', "/api/users?action=search&search=testu"
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        done()

    return

  it 'should find a user even with a typo', (done)->
    getUser()
    .then (user)->
      userId = user._id
      nonAuthReq 'get', "/api/users?action=search&search=testusr"
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        done()

    return

  it 'should not return snapshot data', (done)->
    getUserB()
    .then (user)->
      userId = user._id
      authReq 'get', "/api/users?action=search&search=#{user.username}"
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        should(res.users[0].snapshot).not.be.ok()
        done()

    return

  it 'should find a user by its bio', (done)->
    authReq 'put', '/api/user', { attribute: 'bio', value: 'blablablayouhou' }
    .catch (err)->
      if err.body.status_verbose is 'already up-to-date' then return
      else throw err
    .then getUser
    .then (user)->
      nonAuthReq 'get', "/api/users?action=search&search=#{user.bio}"
      .then (res)->
        (user._id in usersIds(res)).should.be.true()
        done()

    return

usersIds = (res)-> _.pluck res.users, '_id'
