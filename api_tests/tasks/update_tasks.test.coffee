CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, adminReq } = require '../utils/utils'
{ createTask, createTaskWithSuggestionAuthor } = require '../fixtures/tasks'
{ createHuman } = require '../fixtures/entities'

collectEntities = '/api/tasks?action=collect-entities'
bySuspectUri = '/api/tasks?action=by-suspect-uri&uri='
updateTask = '/api/tasks?action=update'


describe 'tasks:update', ->
  it 'should update a task', (done)->
    createTask()
    .then (task)->
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
      adminReq 'put', updateTask,
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

  it 'should update same suspact tasks state to merge', (done) ->
    createTask()
    .then (task)->
      createTask task.suspectUri, 'wd:Q42'
      .then (anotherTask)->
        adminReq 'put', updateTask,
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

  it 'should update relationScore of tasks with same suspect', (done)->
    createHuman { labels: { en: 'Jim Vance' } }
    .then (suspect)->
      authReq 'post', collectEntities
      .delay 1000
      .then -> authReq 'get', bySuspectUri + "inv:#{suspect._id}"
      .get 'tasks'
      .then (tasks)->
        taskToUpdate = tasks[0]
        otherTask = tasks[1]
        taskToUpdate.relationScore.should.be.below 1
        authReq 'put', updateTask,
          id: taskToUpdate._id,
          attribute: 'state',
          value: 'dismissed'
        .delay 1000
        .then -> authReq 'get', "/api/tasks?action=by-ids&ids=#{otherTask._id}"
        .then (res)->
          updatedTask = res.tasks[0]
          updatedTask.relationScore.should.equal 1
          done()
      .catch done

    return
