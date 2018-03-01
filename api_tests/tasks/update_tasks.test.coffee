CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, adminReq } = require '../utils/utils'
{ createTask } = require '../fixtures/tasks'

describe 'tasks:update', ->
  it 'should update a task', (done)->
    createTask()
    .then (task)->
      task.state.should.equal 'requested'
      authReq 'put', '/api/tasks?action=update',
        id: task._id,
        attribute: 'state',
        value: 'dismissed'
      .then (updatedTask)->
        updatedTask[0].ok.should.be.true()
        done()
    .catch done

    return

  it 'should throw if invalid task id', (done)->
    createTask()
    .then (task)->
      task.state.should.equal 'requested'
      authReq 'put', '/api/tasks?action=update',
        id: ''
      .catch (err)->
        err.body.status_verbose.should.be.a.String()
        done()
    .catch done

    return

describe 'tasks:merge-entities', ->
  it 'should update task state from requested to merged', (done) ->
    createTask()
    .then (task)->
      adminReq 'put', '/api/entities?action=merge',
        from: task.suspectUri
        to: task.suggestionUri
      .delay 100
      .then -> authReq 'get', "/api/tasks?action=by-ids&ids=#{task._id}"
      .then (res)->
        updatedTask = res.tasks[0]
        updatedTask.state.should.equal 'merged'
        done()
    .catch done

    return

  it 'should update all tasks that have same suspectUri to merged', (done) ->
    createTask()
    .then (task)->
      createTask task.suspectUri, " wd:Q42"
      .then (anotherTask)->
        adminReq 'put', '/api/entities?action=merge',
          from: task.suspectUri
          to: task.suggestionUri
        .delay 100
        .then -> authReq 'get', "/api/tasks?action=by-ids&ids=#{anotherTask._id}"
        .then (res)->
          updatedTask = res.tasks[0]
          updatedTask.state.should.equal 'merged'
          done()
      .catch done

    return
