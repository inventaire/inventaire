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
        value: 'archived'
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
