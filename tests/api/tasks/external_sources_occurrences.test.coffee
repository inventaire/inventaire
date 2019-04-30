CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ undesiredErr } = __.require 'apiTests', 'utils/utils'
{ checkEntities } = require '../utils/tasks'
{ createHuman, createWorkWithAuthor, randomLabel } = require '../fixtures/entities'
{ getByUris } = require '../utils/entities'

# Tests dependency: having a populated ElasticSearch wikidata index
describe 'tasks:externalSourcesOccurrences', ->
  it 'should return an empty object when author has no occurrences', (done)->
    humanLabel = 'Stanislas Lem' # has no homonyms
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, randomLabel()
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        task = tasks.find (task)-> task.suggestionUri
        task.externalSourcesOccurrences.should.be.empty()
        done()
    .catch undesiredErr(done)

    return

  it 'should create tasks if author has no occurrences', (done)->
    humanLabel = 'Wolfgang Amadeus Mozart'
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, randomLabel()
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        task = tasks.find (task)-> task.suggestionUri.match /wd:/
        task.externalSourcesOccurrences.should.be.empty()
        done()
    .catch undesiredErr(done)

    return

  it 'should return an object of occurrences uris when author has work sourced in their wikipedia page', (done)->
    humanLabel = 'Stanislas Lem' # has no homonyms
    workLabel = 'Solaris' # too short label to be automerged
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        tasks.length.should.aboveOrEqual 1
        task = tasks.find (task)-> task.suggestionUri.match /wd:/
        task.externalSourcesOccurrences.should.an.Array()
        firstOccurrence = task.externalSourcesOccurrences[0]
        firstOccurrence.url.should.be.ok()
        firstOccurrence.matchedTitles.should.containEql workLabel
        done()
    .catch undesiredErr(done)

    return

  it 'should return an object of occurrences uris when author has work sourced in their bnf page', (done)->
    humanLabel = 'Stanislas Lem'
    workLabel = 'Solaris'
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        task = tasks.find (task)-> task.suggestionUri.match /wd:/
        occurrencesUrls = _.map task.externalSourcesOccurrences, 'url'
        occurrencesUrls.join().should.containEql /data.bnf.fr/
        done()
    .catch undesiredErr(done)

    return

  it 'should return an object of occurrences uris when author has work sourced in their bnb page', (done)->
    humanLabel = 'Stanislas Lem'
    workLabel = 'Solaris'
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        task = tasks.find (task)-> task.suggestionUri.match /wd:/
        occurrencesUrls = _.map task.externalSourcesOccurrences, 'url'
        occurrencesUrls.join().should.containEql /bnb.data.bl.uk/
        done()
    .catch undesiredErr(done)

    return

  it 'should return occurence when author has work sourced on OpenLibrary', (done)->
    humanLabel = 'Stanislas Lem'
    workLabel = 'Solaris'
    createHuman { labels: { en: humanLabel } }
    .then (human)->
      createWorkWithAuthor human, workLabel
      .then (work)-> checkEntities human.uri
      .then (tasks)->
        task = tasks.find (task)-> task.suggestionUri.match /wd:/
        occurrencesUrls = _.map task.externalSourcesOccurrences, 'url'
        occurrencesUrls.join().should.containEql /openlibrary.org/
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
        _.map(entities, 'uri')[0].should.match redirectionPrefix
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
