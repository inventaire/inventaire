CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, adminReq } = require '../utils/utils'
updateEndpoint = '/api/tasks?action=update'
{ collectEntities } = require '../fixtures/tasks'
{ getByScore, update } = require '../utils/tasks'

describe 'tasks:update', ->
  it 'should update a task', (done)->
    collectEntities()
    .then getByScore
    .then (tasks)->
      task = tasks[0]
      update task._id, 'state', 'dismissed'
      .then (updatedTask)->
        updatedTask[0].ok.should.be.true()
        done()
    .catch done

    return

  it 'should throw if invalid task id', (done)->
    update ''
    .catch (err)->
      err.body.status_verbose.should.be.a.String()
      done()
    .catch done

    return
