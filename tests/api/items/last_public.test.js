CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ populate } = require '../fixtures/populate'
lastPublicUrl = '/api/items?action=last-public'

describe 'items:last-public', ->
  it 'can take an limit parameter', (done)->
    limit = 2
    populate
      usersCount: 1
      publicItemsPerUser: limit + 1
    .then -> nonAuthReq 'get', lastPublicUrl + "&limit=#{limit}"
    .then (res)->
      res.items.length.should.equal limit
      done()
    .catch undesiredErr(done)

    return

  it 'should fetch 15 last-public items', (done)->
    populate
      usersCount: 1
      publicItemsPerUser: 16
    .then -> nonAuthReq 'get', lastPublicUrl
    .then (res)->
      res.items.length.should.equal 15
      done()
    .catch undesiredErr(done)

    return
