CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ checkEntities } = require '../utils/tasks'
{ createHuman, createWorkWithAuthor } = require '../fixtures/entities'
{ getByUris } = require '../utils/entities'

# Tests dependency: having a populated ElasticSearch wikidata index
describe 'tasks:has-encyclopedia-occurence', ->
  it 'should return false when author has no work', (done)->
    humanLabel = 'Stanislas Lem' # has no homonyms
    createHuman { labels: { en: humanLabel } }
    .then (human)-> checkEntities human.uri
    .then (tasks)->
      tasks.length.should.aboveOrEqual 1
      Q535Task = tasks.find (task)-> task.suggestionUri.match /wd:/
      Q535Task.hasEncyclopediaOccurence.should.be.false()
      done()
    .catch undesiredErr(done)

    return

  it 'should return true when author has work sourced in their wikipedia page', (done)->
    humanLabel = 'Stanislas Lem' # has no homonyms
    workLabel = 'Solaris' # too short label to be automerged
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        Q535Task = tasks.find (task)-> task.suggestionUri.match /wd:/
        Q535Task.hasEncyclopediaOccurence.should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should auto-merge entities if works labels is sufficient', (done)->
    humanLabel = 'Alain Damasio'
    workLabel = 'La horde du Contrevent'
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then -> getByUris human.uri
      .get 'entities'
      .then (entities)->
        redirectionPrefix = /wd:/
        _.pluck(entities, 'uri')[0].should.match redirectionPrefix
        done()
    .catch undesiredErr(done)

    return

  it 'should not merge entities if works labels is too short', (done)->
    humanLabel = 'Francis Steegmuller'
    workLabel = 'Apollinaire'
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        Q535Task = tasks.find (task)-> task.suggestionUri.match /wd:/
        Q535Task.hasEncyclopediaOccurence.should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should not merge entities if author has homonyms', (done)->
    humanLabel = 'Alan Moore' # homonyms Q205739, Q1748845
    workLabel = 'Voice of the Fire' # wd:Q3825051
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        Q535Task = tasks.find (task)-> task.suggestionUri.match /wd:/
        Q535Task.hasEncyclopediaOccurence.should.be.true()
        done()
    .catch undesiredErr(done)

    return
