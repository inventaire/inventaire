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

  it 'should return a user RSS feed when the user has an item', (done)->
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

  it 'should not return private items when not authorized', (done)->
    userPromise = getUser()
    itemAPromise = createItem userPromise, { listing: 'private' }
    itemBPromise = createItem userPromise, { listing: 'network' }

    Promise.all [
      userPromise
      itemAPromise
      itemBPromise
    ]
    .spread (user, itemA, itemB)->
      userId = user._id
      nonAuthReq 'get', "/api/feeds?user=#{userId}"
      .then (res)->
        res.startsWith('<?xml').should.be.true()
        res.includes(itemA._id).should.be.false()
        res.includes(itemB._id).should.be.false()
        done()
    .catch undesiredErr(done)

    return

  it 'should return private items when authorized', (done)->
    userPromise = getUser()
    itemAPromise = createItem userPromise, { listing: 'private' }
    itemBPromise = createItem userPromise, { listing: 'network' }

    Promise.all [
      userPromise
      itemAPromise
      itemBPromise
    ]
    .spread (user, itemA, itemB)->
      { _id: userId, readToken: token } = user
      nonAuthReq 'get', "/api/feeds?user=#{userId}&requester=#{userId}&token=#{token}"
      .then (res)->
        res.startsWith('<?xml').should.be.true()
        res.includes(itemA._id).should.be.true()
        res.includes(itemB._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return
