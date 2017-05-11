CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, authReq, getUser, adminReq } = __.require 'apiTests', 'utils/utils'

describe 'entities:search', ->
  it 'should return a recently created entity', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { fr: 'zzzz yyyy xxxx' }
      claims: { 'wdt:P31': [ 'wd:Q571' ] }
    .delay 1000
    .then (creationRes)->
      nonAuthReq 'get', '/api/entities?action=search&search=zzzz&lang=fr'
      .then (searchRes)->
        done()

    return

  it 'should not return a removed:placeholder entity', (done)->
    Promise.all [
      getUser().get '_id'
      createEntity 'zzzz yyyy xxxxx'
      createEntity 'zzzz yyyy xxxxxx'
    ]
    .spread (userId, fromId, toId)->
      adminReq 'put', '/api/entities?action=merge',
        from: "inv:#{fromId}"
        to: "inv:#{toId}"
      .delay 1000
      .then -> nonAuthReq 'get', '/api/entities?action=search&search=zzzz&lang=fr'
      .then (searchRes)->
        worksIds = _.pluck searchRes.works, '_id'
        (toId in worksIds).should.be.true()
        (fromId not in worksIds).should.be.true()
        done()

    return

createEntity = (label)->
  authReq 'post', '/api/entities?action=create',
    labels: { fr: label }
    claims: { 'wdt:P31': [ 'wd:Q571' ] }
  .get '_id'
