CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ createHuman } = require '../fixtures/entities'
{ getBySuspectUri, collectEntities } = require '../utils/tasks'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'

# Tests dependency:
# - running after a database reset
# - having a populated ElasticSearch wikidata index
# Disabled to avoid crashing tests when those depdendencies aren't met
describe 'tasks:collect-entities', ->
  xit 'should create new tasks', (done)->
    Promise.all [
      createHuman { labels: { en: 'Stanislas Lem' } }
      createHuman { labels: { en: 'Stanislas Lem' } }
    ]
    .then (humans)->
      uris = _.pluck humans, 'uri'
      collectEntities()
      .delay 5000
      .then -> Promise.all uris.map(getBySuspectUri)
      .map (tasks)-> tasks.length.should.aboveOrEqual 1
      .then -> done()
    .catch undesiredErr(done)

    return
