CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, adminReq } = require '../utils/utils'

byScore = '/api/tasks?action=by-score'
updateEndpoint = '/api/tasks?action=update'

describe 'tasks:update', ->
  it 'should update a task', (done)->
    collectEntities()
    .then -> authReq 'get', byScore
    .get 'tasks'
    .then (tasks)->
      task = tasks[0]
      adminReq 'put', updateEndpoint,
        id: task._id,
        attribute: 'state',
        value: 'dismissed'
      .then (updatedTask)->
        updatedTask[0].ok.should.be.true()
        done()
    .catch done

    return

  it 'should throw if invalid task id', (done)->
    adminReq 'put', updateEndpoint,
      id: ''
    .catch (err)->
      err.body.status_verbose.should.be.a.String()
      done()
    .catch done

    return
