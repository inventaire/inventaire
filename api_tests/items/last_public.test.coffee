CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
populate = require '../fixtures/populate'
lastPublicUrl = '/api/items?action=last-public'

describe 'items:last-public', ->
  it 'should fetch 15 last-public items', (done)->
    populate
      usersCount: 1
      publicItemsPerUser: 16
    .then -> nonAuthReq 'get', lastPublicUrl
    .then (res)-> res.items.length.should.equal 15

    .delay 10
    .then -> done()
    .catch undesiredErr(done)
    return
