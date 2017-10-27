CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
populate = require '../fixtures/populate'
recentPublicUrl = '/api/items?action=recent-public'

describe 'items:recent-public', ->
  it 'should fetch 15 recent-public items', (done)->
    populate
      usersCount: 1
      publicItemsPerUser: 16
    .then -> nonAuthReq 'get', recentPublicUrl
    .then (res)->
      res.items.length.should.equal 15

    .delay 10
    .then -> done()
    .catch undesiredErr(done)
    return

  it 'should fetch items from minimum 5 owners', (done)->
    populate
      usersCount: 2
      publicItemsPerUser: 4
    .then ->
      nonAuthReq 'get', recentPublicUrl
    .then (res)->
      res.users.length.should.be.above 4

    .delay 10
    .then -> done()
    .catch undesiredErr(done)
    return
