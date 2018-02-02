CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq } = require '../utils/utils'
{ createTask } = require '../fixtures/tasks'

describe 'tasks:update', ->
  it 'should update a task', (done)->
    createTask()
    .then (res)->
      task = res.tasks[0]
      task.state.should.equal 'requested'
      authReq 'put', '/api/tasks?action=update',
        taskId: task._id,
        attribute: 'state',
        value: 'archived'
      .then (updatedTask)->
        updatedTask.state.should.equal 'archived'
        done()
    .catch done

    return

  it 'should throw if invalid task id', (done)->
    createTask()
    .then (res)->
      task = res.tasks[0]
      task.state.should.equal 'requested'
      authReq 'put', '/api/tasks?action=update',
        taskId: ""
      .catch (err)->
        err.body.status_verbose.should.be.a.String()
        done()
    .catch done

    return
