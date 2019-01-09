should = require 'should'
{ undesiredErr } = require '../utils/utils'
{ checkEntities } = require '../utils/tasks'
{ createHuman, createWorkWithAuthor, randomWorkLabel } = require '../fixtures/entities'

# Tests dependency: having a populated ElasticSearch wikidata index
describe 'tasks:automerge', ->
  it 'should automerge if author has homonyms but only one has occurrences', (done)->
    humanLabel = 'Alan Moore' # homonyms Q205739, Q1748845
    workLabel = 'Voice of the Fire' # wd:Q3825051
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then -> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.equal 0
        done()
    .catch undesiredErr(done)

    return

  it 'should automerge if suspect and suggestion workLabel are similar', (done)->
    humanLabel = 'Alain Damasio' # wdId Q2829704
    workLabel = randomWorkLabel()
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      Promise.all [
        createWorkWithAuthor { uri: "wd:Q2829704" }, workLabel
        createWorkWithAuthor human, workLabel
      ]
      .then -> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.equal 0
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
        done()
    .catch undesiredErr(done)

    return
