CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
randomString = __.require 'lib', './utils/random_string'

createTaskPath = '/api/tasks?action=create'
{ authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'

validTask =
  type: 'deduplicate',
  suspectUri: "inv:5bb3931277d7358580a8aa265803013b",
  suggestionUri: randomString 10
  lexicalScore: 4
  relationScore: 1
  hasEncyclopediaOccurence: true

describe 'tasks:create', ->
  it 'should create new tasks', (done)->
    authReq 'post', createTaskPath,
      tasks: [ validTask ]
    .then (res)->
      task = res.tasks[0]
      task.should.containDeep validTask
      task._id.should.be.a.String()
      done()
    .catch undesiredErr(done)

    return

  it 'should not create a task with invalid type', (done)->
    tasks = [ { type: 'invalidTypeee' } ]
    authReq 'post', createTaskPath, { tasks }
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid type'
      done()
    .catch undesiredErr(done)

    return

  it 'should not create a task with invalid state', (done)->
    tasks = [ { type: 'deduplicate', state: 'invalid' } ]
    authReq 'post', createTaskPath, { tasks }
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid state'
      done()
    .catch undesiredErr(done)

    return

  it 'should not create a task without a valid suspect URI', (done)->
    tasks = [ { type: 'deduplicate', suspectUri: 'inv:alidID1234' } ]
    authReq 'post', createTaskPath, { tasks }
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid suspect'
      done()
    .catch undesiredErr(done)

    return

  it 'should not create a task if another task already have same suspect AND suggestion uris', (done)->
    validTask.suspectUri = "inv:026a1856df319a2fe3c14c4db602ab1b"
    authReq 'post', createTaskPath, { tasks: [ validTask ] }
    .then ->
      authReq 'post', createTaskPath, { tasks: [ validTask ] }
      .catch (err)->
        err.body.status_verbose.should.equal 'one or several tasks already created'
        done()
    .catch undesiredErr(done)

    return

  it 'should have a lexical rounded at 2 decimals', (done)->
    validTask.suspectUri = "inv:026a1856df319a2fe3c14c4db602ab1a"
    validTask.lexicalScore = 4.123456789
    authReq 'post', createTaskPath,
      tasks: [ validTask ]
    .then (res)->
      task = res.tasks[0]
      task.lexicalScore.toString().length.should.belowOrEqual 4
      done()
    .catch undesiredErr(done)

    return
