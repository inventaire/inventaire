should = require 'should'
{ undesiredErr } = require '../utils/utils'
{ checkEntities } = require '../utils/tasks'
{ getByUris } = require '../utils/entities'
{ createHuman, createWorkWithAuthor, randomLabel } = require '../fixtures/entities'

# Tests dependency: having a populated ElasticSearch wikidata index
describe 'tasks:automerge', ->
  it 'should automerge if author has homonyms but only one has occurrences', (done)->
    humanLabel = 'Alan Moore' # homonyms Q205739, Q1748845
    WdUri = 'wd:Q205739'
    workLabel = 'Voice of the Fire' # wd:Q3825051
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then -> checkEntities human.uri
      .then (tasks)-> tasks.length.should.equal 0
      .then ->
        getByUris human.uri
        .get 'entities'
        .then (entities)->
          # entity should have merged, thus URI is now a a WD uri
          entities[WdUri].should.be.ok()
          done()
    .catch undesiredErr(done)

    return

  it 'should automerge if suspect and suggestion workLabel are similar', (done)->
    humanLabel = 'Alain Damasio' # wdId Q2829704
    wikidataUri = 'wd:Q2829704'
    workLabel = randomLabel()
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      Promise.all [
        createWorkWithAuthor { uri: wikidataUri }, workLabel
        createWorkWithAuthor human, workLabel
      ]
      .then -> checkEntities human.uri
      .then ->
        getByUris human.uri
        .get 'entities'
        .then (entities)->
          entities[wikidataUri].should.be.ok()
          done()
    .catch undesiredErr(done)

    return

  it 'should not automerge if author name is in work title', (done)->
    humanLabel = 'Frédéric Lordon'
    workLabel = humanLabel
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then -> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        firstOccurenceMatch = tasks[0].externalSourcesOccurrences[0].matchedTitles[0]
        firstOccurenceMatch.should.equal humanLabel
        done()
    .catch undesiredErr(done)

    return
