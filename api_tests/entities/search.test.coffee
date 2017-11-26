CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, getUser, adminReq, undesiredErr } = require '../utils/utils
'
randomString = __.require 'lib', './utils/random_string'
{ createWork } = require '../fixtures/entities'

describe 'entities:search', ->
  it 'should return a recently created entity', (done)->
    label = randomString(10)
    createWork { labels: { fr: label } }
    .delay 1000
    .then (creationRes)->
      createdWorkId = creationRes._id
      nonAuthReq 'get', "/api/entities?action=search&search=#{label}&lang=fr"
      .then (searchRes)->
        worksIds = _.pluck searchRes.works, '_id'
        (createdWorkId in worksIds).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should not return a removed:placeholder entity', (done)->
    label = randomString 10
    Promise.all [
      getUser().get '_id'
      createWork({ labels: { fr: label } }).get '_id'
      createWork({ labels: { fr: label } }).get '_id'
    ]
    .spread (userId, fromId, toId)->
      adminReq 'put', '/api/entities?action=merge',
        from: "inv:#{fromId}"
        to: "inv:#{toId}"
      .delay 1000
      .then -> nonAuthReq 'get', "/api/entities?action=search&search=#{label}&lang=fr"
      .then (searchRes)->
        worksIds = _.pluck searchRes.works, '_id'
        (toId in worksIds).should.be.true()
        (fromId not in worksIds).should.be.true()
        done()
    .catch undesiredErr(done)

    return
