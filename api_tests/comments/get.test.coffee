CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createItem } = require '../fixtures/items'

describe 'comments:get', ->
  it 'should get user comments', (done)->
    createItem()
    .then (item)->
      authReq 'get', "/api/comments?item=#{item._id}"
      .then (res)->
        res.comments.should.be.an.Array()
        done()
    .catch undesiredErr(done)

    return
