CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, getUser, undesiredErr } = require '../utils/utils'
{ createUser } = require '../fixtures/users'
qs = require 'querystring'

describe 'groups:search-by-position', ->
  it 'should get groups by position', (done)->
    createUser { position: [ 1, 1 ] }
    .delay 100
    .then (user)->
      bbox = qs.escape JSON.stringify([ 0, 0, 2, 2 ])
      nonAuthReq 'get', "/api/users?action=search-by-position&bbox=#{bbox}"
      .then (res)->
        res.users.should.be.an.Array()
        usersIds = _.map(res.users, '_id')
        should(user._id in usersIds).be.true()
        done()
    .catch done

    return
