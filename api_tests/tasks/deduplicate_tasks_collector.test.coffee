CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
randomString = __.require 'lib', './utils/random_string'

deduplicateEntities = '/api/tasks?action=deduplicate-entities'
deduplicates = '/api/tasks?action=deduplicates&limit=1000'

{ authReq, nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'

describe 'tasks:deduplicate-entities', ->
  it 'should get new tasks created', (done)->
    createHuman { labels: { en: 'Stanislas Lem' } }
    .then (suspect)->
      suspectId = suspect._id

      nonAuthReq 'get', deduplicateEntities
      .then -> nonAuthReq 'get', deduplicates
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        tasksUris = _.pluck tasks, 'suspectUri'
        tasksUris.should.containEql "inv:#{suspectId}"
        done()
      .catch undesiredErr(done)

    return

  it 'should not re-create existing tasks', (done)->
    createHuman { labels: { en: 'Stanislas Lem' } }
    .then (suspect)->
      suspectId = suspect._id

      nonAuthReq 'get', deduplicateEntities
      .then -> nonAuthReq 'get', deduplicateEntities
      .then -> nonAuthReq 'get', deduplicates
      .then (tasks)->
        uniqSuspectUris = _.uniq _.pluck(tasks, 'suspectUri')
        tasks.length.should.equal uniqSuspectUris.length
        done()
      .catch undesiredErr(done)

    return
