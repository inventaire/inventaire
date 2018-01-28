CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
randomString = __.require 'lib', './utils/random_string'

createTaskPath = '/api/tasks?action=create'
{ authReq, nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'

describe 'tasks:create', ->
  it 'should create new tasks', (done)->
    createHuman randomString(10)
    .then (suspect)->
      suspectId = suspect._id
      tasks = [
        {
          type: 'deduplicate',
          suspectUri: "inv:#{suspectId}",
          suggestionUri: randomString 10
          elasticScore: 4
        }
      ]
      authReq 'post', createTaskPath, { tasks }
      .then (res)->
        task = res.tasks[0]
        task.type.should.equal 'deduplicate'
        task.state.should.equal 'requested'
        task.suspectUri.should.equal "inv:#{suspectId}"
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
    createHuman randomString(10)
    .then (suspect)->
      suspectId = suspect._id
      newTaskDoc =
        type: 'deduplicate'
        suspectUri: "inv:#{suspectId}"
        suggestionUri: randomString 10
        elasticScore: 8.124

      authReq 'post', createTaskPath, { tasks: [ newTaskDoc ] }
      .then ->
        authReq 'post', createTaskPath, { tasks: [ newTaskDoc ] }
        .catch (err)->
          err.body.status_verbose.should.equal 'one or several tasks already created'
          done()
      .catch undesiredErr(done)

    return
