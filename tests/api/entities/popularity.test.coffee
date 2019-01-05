CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, nonAuthReq, undesiredErr, undesiredRes } = require '../utils/utils'
{ addClaim } = require '../utils/entities'
{ createEdition, createWork, createItemFromEntityUri, createSerie, createHuman } = require '../fixtures/entities'

describe 'entities:popularity', ->
  describe 'edition', ->
    it 'should reject invalid uri', (done)->
      invalidUri = 'inv:aliduri'
      getPopularity invalidUri
      .then undesiredRes(done)
      .catch (err)->
        err.body.status_verbose.should.startWith 'invalid '
        done()
      .catch undesiredErr(done)

      return

    it 'should default to 0', (done)->
      createEdition()
      .then (edition)-> scoreShouldEqual edition.uri, 0, done
      .catch done

      return
    it 'should equal the amount of instances in inventories', (done)->
      createEdition()
      .then (edition)->
        { uri } = edition
        scoreShouldEqual uri, 0
        .then -> createItemFromEntityUri uri
        .then -> scoreShouldEqual uri, 1, done
      .catch done

      return

    it 'should count only one instance per owner', (done)->
      createEdition()
      .then (edition)->
        { uri } = edition
        createItemFromEntityUri uri, { details: '1' }
        .then -> createItemFromEntityUri uri, { details: '2' }
        .then -> scoreShouldEqual uri, 1, done
      .catch done

      return

  describe 'work', ->
    it 'should default to 0', (done)->
      createWork()
      .then (work)-> scoreShouldEqual work.uri, 0, done
      .catch done

      return

    it 'should be incremented by every instances of editions', (done)->
      createEdition()
      .then (edition)->
        workUri = edition.claims['wdt:P629'][0]
        scoreShouldEqual workUri, 1
        .then createItemFromEntityUri.bind(null, edition.uri)
        .then -> scoreShouldEqual workUri, 2, done
      .catch done

      return

  describe 'serie', ->
    it 'should be made of the sum of its parts scores + number of parts', (done)->
      createSerieWithAWorkWithAnEditionWithAnItem()
      # 1: item
      # 1: edition
      # 1: work
      .spread (serie)-> scoreShouldEqual serie.uri, 3, done
      .catch done

      return

  describe 'human', ->
    it 'should be made of the sum of its works scores + number of works and series', (done)->
      createHumanWithAWorkWithAnEditionWithAnItem()
      .spread (human)->
        # 1: item
        # 1: edition
        # 1: work
        # 1: serie
        scoreShouldEqual human.uri, 4, done
      .catch done

      return

getPopularity = (uri)->
  nonAuthReq 'get', "/api/entities?action=popularity&uris=#{uri}&refresh=true"

getScore = (uri)->
  getPopularity uri
  .then (res)-> res.scores[uri]

scoreShouldEqual = (uri, value, done)->
  getScore uri
  .then (score)->
    score.should.equal value
    done?()
    return score

createSerieWithAWorkWithAnEditionWithAnItem = ->
  Promise.all [
    createWork()
    createSerie()
  ]
  .spread (work, serie)->
    Promise.all [
      createEdition { work }
      addClaim work.uri, 'wdt:P179', serie.uri
    ]
    .spread (edition)->
      createItemFromEntityUri edition.uri, { lang: 'en' }
      .then (item)-> [ serie, work, edition, item ]

createHumanWithAWorkWithAnEditionWithAnItem = ->
  createHuman()
  .then (human)->
    createSerieWithAWorkWithAnEditionWithAnItem()
    .spread (serie, work, edition, item)->
      Promise.all [
        addClaim work.uri, 'wdt:P50', human.uri
        addClaim serie.uri, 'wdt:P50', human.uri
      ]
      .then -> [ human, serie, work, edition, item ]
