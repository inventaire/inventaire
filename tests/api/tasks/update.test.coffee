CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ createHuman } = require '../fixtures/entities'
{ update, checkEntities } = require '../utils/tasks'

describe 'tasks:update', ->
  it 'should update a task', (done)->
    createHuman { labels: { en: 'Fred Vargas' } }
    .then (human)-> checkEntities human.uri
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
