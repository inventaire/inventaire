CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, undesiredErr } = require '../utils/utils'
{ getByUris, addClaim } = require '../utils/entities'
{ createWork, createHuman, createEdition, someOpenLibraryId, randomWorkLabel, generateIsbn13 } = require '../fixtures/entities'
resolve = (entry)-> authReq 'post', '/api/entities?action=resolve', entry

describe 'entities:resolver:update-resolved', ->
  it 'should update works claim values', (done)->
    olId = someOpenLibraryId 'work'
    authorUri = 'wd:Q35802'
    authorUri2 = 'wd:Q184226'
    authorUri3 = 'wd:Q2300248'
    entry =
      edition: [ { isbn: generateIsbn13() } ]
      works: [
        claims:
          'wdt:P648': [ olId ],
          'wdt:P50': [ authorUri, authorUri2, authorUri3 ]
      ]
      options: [ 'update' ]
    createWork()
    .tap (work)-> addClaim work.uri, 'wdt:P648', olId
    .tap (work)-> addClaim work.uri, 'wdt:P50', authorUri3
    .then (work)->
      resolve(entry).get('result')
      .then (result)->
        entityUri = result.works[0].uri
        getByUris(entityUri).get 'entities'
        .then (entities)->
          authorClaimValues = _.values(entities)[0].claims['wdt:P50']
          authorClaimValues.should.containEql authorUri
          authorClaimValues.should.containEql authorUri2
          authorClaimValues.should.containEql authorUri3
          done()
    .catch done

    return

  it 'should update authors claim values', (done)->
    olId = someOpenLibraryId 'author'
    officialWebsite = 'http://Q35802.org'
    entry =
      edition: [ { isbn: generateIsbn13() } ]
      authors: [
        claims:
          'wdt:P648': [ olId ],
          'wdt:P856': [ officialWebsite ]
      ]
      options: [ 'update' ]
    createHuman()
    .tap (human)-> addClaim human.uri, 'wdt:P648', olId
    .then (work)->
      resolve(entry).get('result')
      .then (result)->
        entityUri = result.authors[0].uri
        getByUris(entityUri).get 'entities'
        .then (entities)->
          authorClaimValues = _.values(entities)[0].claims['wdt:P856']
          authorClaimValues.should.containEql officialWebsite
          done()
    .catch done

    return
