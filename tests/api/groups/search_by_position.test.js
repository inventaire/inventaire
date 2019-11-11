CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq } = require '../utils/utils'
{ groupPromise, endpointAction } = require '../fixtures/groups'
qs = require 'querystring'

describe 'groups:search-by-position', ->
  it 'should get groups by position', (done)->
    groupPromise
    .then (group)->
      bbox = qs.escape JSON.stringify([ 0, 0, 2, 2 ])
      nonAuthReq 'get', "#{endpointAction}=search-by-position&bbox=#{bbox}"
      .then (res)->
        res.groups.should.be.an.Array()
        groupsIds = _.map(res.groups, '_id')
        should(group._id in groupsIds).be.true()
        done()
    .catch done

    return
