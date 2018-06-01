CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

byScore = '/api/tasks?action=by-score'
bySuspectUri = '/api/tasks?action=by-suspect-uri&uri='
{ authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'
{ collectEntities } = require '../fixtures/tasks'


describe 'tasks:byScore', ->
  it 'should returns 10 or less tasks to deduplicates, by default', (done)->
    collectEntities()
    .then -> authReq 'get', byScore
    .then (res)->
      res.should.be.an.Object()
      { tasks } = res
      tasks.length.should.be.belowOrEqual 10
      tasks.length.should.be.aboveOrEqual 1
      done()
    .catch undesiredErr(done)

    return

  it 'should returns a limited array of tasks to deduplicate', (done)->
    authReq 'get', byScore + '&limit=1'
    .then (res)->
      res.tasks.length.should.equal 1
      done()
    .catch undesiredErr(done)

    return

  it 'should take an offset parameter', (done)->
    collectEntities()
    .then -> authReq 'get', byScore
    .then (res)->
      offset = 1
      firstOffsetTask = res.tasks[offset]
      authReq 'get', byScore + "&offset=#{offset}"
      .then (res)->
        firstTask = res.tasks[0]
        firstTask.should.deepEqual firstOffsetTask
        done()
    .catch undesiredErr(done)

    return

describe 'tasks:bySuspectUri', ->
  it 'should return an array of tasks', (done)->
    collectEntities()
    .then (res)-> authReq 'get', bySuspectUri + res.humans[0].uri
    .then (res)->
      suspectUris = _.pluck res.tasks, 'suspectUri'
      suspectUris.should.be.an.Array()
      _.uniq(suspectUris).length.should.equal 1
      done()
    .catch undesiredErr(done)

    return
