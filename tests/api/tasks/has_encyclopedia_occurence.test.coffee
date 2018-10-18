CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ checkEntities } = require '../utils/tasks'
{ createHuman, createWorkWithAuthor } = require '../fixtures/entities'

# Tests dependency: having a populated ElasticSearch wikidata index
describe 'tasks:has-encyclopedia-occurence', ->
  it 'should return true when author has work sourced in their wikipedia page', (done)->
    createHuman { labels: { en: 'Victor Hugo' } }
    .then (human)->
      createWorkWithAuthor human, 'Ruy Blas'
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        Q535Task = tasks.find (task)-> task.suggestionUri is 'wd:Q535'
        Q535Task.hasEncyclopediaOccurence.should.be.true()
        done()
      .catch undesiredErr(done)

    return
