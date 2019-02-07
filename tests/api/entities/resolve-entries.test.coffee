CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, undesiredRes, undesiredErr } = require '../utils/utils'
{ createWork, createEdition, createHuman, someOpenLibraryId, createWorkWithAuthor, generateIsbn13 } = require '../fixtures/entities'
{ getByUris } = require '../utils/entities'
{ addClaim } = require '../utils/entities'
{ ensureEditionExists, randomWorkLabel, humanName } = require '../fixtures/entities'
resolveEntries = (entry)-> authReq 'post', '/api/entities?action=resolve-entries', entry

describe 'entities:resolve-entries', ->
  it 'should resolve entries of editions from an ISBN', (done)->
    ensureEditionExists 'isbn:9782203399303'
    .then -> resolveEntries
      entries: [ { edition: [ { isbn: '9782203399303' } ] } ]
    .get 'result'
    .then (result)->
      result.should.be.an.Object()
      result[0].edition[0].uri.should.equal 'isbn:9782203399303'
      done()
    .catch done

    return

  it 'should create edition with title and isbn', (done)->
    resolveEntries
      entries: [
        edition: [ { isbn: generateIsbn13() } ]
        works: [ { labels: { en: randomWorkLabel() } } ]
      ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      entityUri = result[0].edition[0].uri
      should(entityUri).be.ok()
      getByUris entityUri
      .get 'entities'
      .then (entities)->
        editionClaims = _.values(entities)[0].claims
        should(editionClaims['wdt:P212'][0]).be.ok()
        done()
    .catch undesiredErr(done)

    return
