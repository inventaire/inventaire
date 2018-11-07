CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
should = require 'should'
{ nonAuthReq, getUser, undesiredErr } = require '../utils/utils'
{ createItem } = require '../fixtures/items'

describe 'feeds:get', ->
  it 'should return a user RSS feed', (done)->
    getUser()
    .then (user)->
      userId = user._id
      nonAuthReq 'get', "/api/feeds?user=#{userId}"
      .then (res)->
        res.startsWith('<?xml').should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a user RSS feed when the user an item', (done)->
    userPromise = getUser()
    itemPromise = createItem userPromise

    Promise.all [
      userPromise
      itemPromise
    ]
    .spread (user, item)->
      userId = user._id
      nonAuthReq 'get', "/api/feeds?user=#{userId}"
      .then (res)->
        res.includes(item._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a user RSS feed when requested with special rights', (done)->
    getUser()
    .then (user)->
      { _id:userId, readToken:token } = user
      nonAuthReq 'get', "/api/feeds?user=#{userId}&requester=#{userId}&token=#{token}"
      .then (res)->
        res.startsWith('<?xml').should.be.true()
        done()
    .catch undesiredErr(done)

    return
