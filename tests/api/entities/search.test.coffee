CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ getUserId, undesiredErr } = require '../utils/utils'
{ createWork, workLabel } = require '../fixtures/entities'
{ search, merge } = require '../utils/entities'

describe 'entities:search', ->
  it 'should return a recently created entity', (done)->
    label = workLabel()
    createWork { labels: { fr: label } }
    .delay 1000
    .then (creationRes)->
      createdWorkId = creationRes._id
      search label, 'fr'
      .then (searchRes)->
        worksIds = _.pluck searchRes.works, '_id'
        (createdWorkId in worksIds).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should not return a removed:placeholder entity', (done)->
    label = workLabel()
    Promise.all [
      getUserId()
      createWork({ labels: { fr: label } }).get '_id'
      createWork({ labels: { fr: label } }).get '_id'
    ]
    .spread (userId, fromId, toId)->
      merge fromId, toId
      .delay 1000
      .then -> search label, 'fr'
      .then (searchRes)->
        worksIds = _.pluck searchRes.works, '_id'
        (toId in worksIds).should.be.true()
        (fromId not in worksIds).should.be.true()
        done()
    .catch undesiredErr(done)

    return
