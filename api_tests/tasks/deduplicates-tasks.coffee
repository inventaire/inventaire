CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'

deduplicates = '/api/tasks?action=deduplicates'
{ nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'
{ createTask } = require '../fixtures/tasks'

describe 'tasks:deduplicates', ->
  it 'should returns less than 10 tasks to deduplicates, by default', (done)->
    createHuman('Stanislas Lem')
    .then (res)-> createTask(res.uri)
    .then (res)-> nonAuthReq 'get', deduplicates
    .then (res)->
      res.should.be.an.Array()
      res.length.should.be.belowOrEqual 10
      done()
    .catch undesiredErr(done)

    return

  it 'should returns a limited array of tasks to deduplicates', (done)->
    nonAuthReq 'get', deduplicates + "&limit=1"
    .then (res)->
      res.should.be.an.Array()
      res.length.should.equal 1
      done()
    .catch undesiredErr(done)

    return
