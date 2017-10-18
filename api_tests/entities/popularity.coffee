CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, nonAuthReq, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ createEdition, createWork, createItemFromEntityUri, addClaim, createSerie, createHuman } = require './helpers'

describe 'entities:popularity', ->
  describe 'edition', ->
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

    it 'should be incremented by every instances in inventories', (done)->
      createWorkWithAnItem()
      .then (work)-> scoreShouldEqual work.uri, 1, done
      .catch done

      return

    it 'should be incremented by any statement made with it as value', (done)->
      Promise.all [
        createEdition()
        createWork()
      ]
      .spread (edition, workB)->
        workAUri = edition.claims['wdt:P629'][0]
        scoreShouldEqual workAUri, 1
        .then -> addClaim workB.uri, 'wdt:P921', workAUri
        .then -> scoreShouldEqual workAUri, 2, done
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
    it 'should be made of the sum of its parts scores', (done)->
      createSerieWithTwoWorksWithTwoClaims()
      # 2: work items
      # 2: work being claim values
      # 2: the serie having both work linking to it
      .spread (serie)-> scoreShouldEqual serie.uri, 6, done
      .catch done

      return

  describe 'human', ->
    it 'should be made of the sum of its works scores + series links count', (done)->
      createHuman()
      .then (human)->
        createSerieWithTwoWorksWithTwoClaims()
        .spread (serie, workA, workB)->
          Promise.all [
            addClaim serie.uri, 'wdt:P50', human.uri
            addClaim workA.uri, 'wdt:P50', human.uri
            addClaim workB.uri, 'wdt:P50', human.uri
          ]
          # 2: work items
          # 2: work being claim values
          # 2: the serie having both work linking to it
          # 3: the author having both work and the serie linking to it
          .then -> scoreShouldEqual human.uri, 9, done
      .catch done

      return

getPopularity = (uri, fast=false)->
  nonAuthReq 'get', "/api/entities?action=popularity&uris=#{uri}&refresh=true&fast=#{fast}"

getScore = (uri, fast)->
  getPopularity uri, fast
  .then (res)-> res.scores[uri]

scoreShouldEqual = (uri, value, done)->
  getScore uri
  .then (score)->
    score.should.equal value
    done?()
    return score

createWorkWithAnItem = ->
  createWork()
  .then (work)->
    createItemFromEntityUri work.uri, { lang: 'en' }
    .then -> return work

createSerieWithTwoWorksWithTwoClaims = ->
  Promise.all [
    createSerie()
    createWorkWithAnItem()
    createWorkWithAnItem()
  ]
  .spread (serie, workA, workB)->
    _.log serie, 'serie'
    Promise.all [
      addClaim workB.uri, 'wdt:P179', serie.uri
      addClaim workA.uri, 'wdt:P179', serie.uri
    ]
    .then ->
      Promise.all [
        # Setting each others as work subject
        # to increment each of their scores of 1
        addClaim workB.uri, 'wdt:P921', workA.uri
        addClaim workA.uri, 'wdt:P921', workB.uri
      ]
    .then -> return Promise.all [ serie, workA, workB ]
