CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ collectEntities } = require '../fixtures/tasks'
{ getByScore } = require '../utils/tasks'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'

describe 'tasks:collect-entities', ->
  it 'should create new tasks', (done)->
    collectEntities()
    .then (res)->
      suspectUri = res.humans[0].uri
      getByScore()
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        # with a suspect
        tasksUris = _.pluck tasks, 'suspectUri'
        tasksUris.should.containEql suspectUri
        # with a relationScore
        taskRelationScores = _.pluck tasks, 'relationScore'
        _.compact(taskRelationScores).length.should.equal taskRelationScores.length
        done()
      .catch undesiredErr(done)

    return

  it 'should not re-create existing tasks', (done)->
    collectEntities()
    .then (res)->
      getByScore()
      .then (tasks)->
        uniqSuspectUris = _.uniq _.pluck(tasks, 'suspectUri')
        tasks.length.should.equal uniqSuspectUris.length
        done()
    .catch undesiredErr(done)

    return
