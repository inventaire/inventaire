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
  it 'should return an empty object when author has no occurences', (done)->
    humanLabel = 'Stanislas Lem' # has no homonyms
    workLabel = 'fakeworklabel'
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        task = tasks.find (task)-> task.suggestionUri
        task.hasEncyclopediaOccurence.should.be.empty()
        done()
    .catch undesiredErr(done)

    return

  it 'should return an object of occurences uris when author has work sourced in their wikipedia page', (done)->
    humanLabel = 'Stanislas Lem' # has no homonyms
    workLabel = 'Solaris' # too short label to be automerged
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        task = tasks.find (task)-> task.suggestionUri.match /wd:/
        task.hasEncyclopediaOccurence.should.an.Array()
        firstOccurence = task.hasEncyclopediaOccurence[0]
        firstOccurence.uri.should.be.ok()
        firstOccurence.url.should.be.ok()
        firstOccurence.matchedTitles.should.containEql workLabel
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
        done()
    .catch undesiredErr(done)

    return
