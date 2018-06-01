CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
randomString = __.require 'lib', './utils/random_string'
{ collectEntities } = require '../fixtures/tasks'
byScore = '/api/tasks?action=by-score&limit=1000'

{ authReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'

describe 'tasks:collect-entities', ->
  it 'should create new tasks', (done)->
    collectEntities()
    .then (res)->
      suspectUri = res.humans[0].uri
      authReq 'get', byScore
      .get 'tasks'
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
      authReq 'get', byScore
      .get 'tasks'
      .then (tasks)->
        uniqSuspectUris = _.uniq _.pluck(tasks, 'suspectUri')
        tasks.length.should.equal uniqSuspectUris.length
        done()
    .catch undesiredErr(done)

    return
