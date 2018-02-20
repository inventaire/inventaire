CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

byScore = '/api/tasks?action=by-score'
bySuspectUri = '/api/tasks?action=by-suspect-uri'
{ nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'
{ createTask } = require '../fixtures/tasks'

describe 'tasks:byScore', ->
  it 'should returns 10 or less tasks to deduplicates, by default', (done)->
    createHuman 'Stanislas Lem'
    .then (res)-> createTask res.uri
    .then (res)-> nonAuthReq 'get', byScore
    .then (res)->
      res.should.be.an.Object()
      { tasks } = res
      tasks.length.should.be.belowOrEqual 10
      tasks.length.should.be.aboveOrEqual 1
      done()
    .catch undesiredErr(done)

    return

  it 'should returns a limited array of tasks to deduplicate', (done)->
    nonAuthReq 'get', byScore + "&limit=1"
    .then (res)->
      res.tasks.length.should.equal 1
      done()
    .catch undesiredErr(done)

    return

  it 'should returns an array of tasks sorted by score', (done)->
    nonAuthReq 'get', byScore
    .then (res)->
      { tasks } = res
      tasks.forEach (task, index)->
        if index < tasks.length - 1
          task.elasticScore.should.be.aboveOrEqual(tasks[index + 1].elasticScore)
      done()
    .catch undesiredErr(done)

    return

describe 'tasks:bySuspectUri', ->
  it 'should return an Array of tasks', (done)->
    createHuman 'John Byrne'
    .then (res)-> createTask res.uri
    .then (res)->
      uri = res.tasks[0].suspectUri
      query = bySuspectUri "&uri=#{uri}"
      nonAuthReq 'get', query
      .then (res)->
        { tasks } = res
        res.tasks.should.be.an.Array()
        tasks.length.should.be.aboveOrEqual 1

        done()
    .catch undesiredErr(done)

    return
