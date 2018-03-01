CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

byScore = '/api/tasks?action=by-score'
bySuspectUri = '/api/tasks?action=by-suspect-uri&uri='
{ authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'
{ createTask } = require '../fixtures/tasks'

describe 'tasks:byScore', ->
  it 'should returns 10 or less tasks to deduplicates, by default', (done)->
    createHuman 'Stanislas Lem'
    .then (res)-> createTask res.uri
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
    authReq 'get', byScore + "&limit=1"
    .then (res)->
      res.tasks.length.should.equal 1
      done()
    .catch undesiredErr(done)

    return

describe 'tasks:bySuspectUri', ->
  it 'should return an Array of tasks', (done)->
    createTask()
    .then (task)->
      createTask task.suspectUri, "wd:Q42"
      .then (secondTask)->
        authReq 'get', bySuspectUri + secondTask.suspectUri
        .then (res)->
          { tasks } = res
          suspectUris = _.pluck(tasks, 'suspectUri')
          _.uniq(suspectUris).length.should.equal 1


          done()
    .catch undesiredErr(done)

    return
