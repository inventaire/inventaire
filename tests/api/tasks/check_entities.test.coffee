CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ checkEntities, getBySuspectUri } = require '../utils/tasks'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createHuman } = require '../fixtures/entities'

# Tests dependency: having a populated ElasticSearch wikidata index
describe 'tasks:check-entities', ->
  it 'should directly create tasks for the requested URIs', (done)->
    createHuman { labels: { en: 'Fred Vargas' } }
    .then (human)->
      checkEntities human.uri
      .then (tasks)->
        tasks.should.be.an.Array()
        tasks[0].suspectUri.should.equal human.uri
        done()
    .catch undesiredErr(done)

    return

  it 'should not re-create existing tasks', (done)->
    createHuman { labels: { en: 'Fred Vargas' } }
    .then (human)->
      checkEntities human.uri
      .then -> checkEntities human.uri
      .then -> getBySuspectUri human.uri
      .then (tasks)->
        uniqSuspectUris = _.uniq _.pluck(tasks, 'suspectUri')
        tasks.length.should.equal uniqSuspectUris.length
        done()
    .catch undesiredErr(done)

    return
