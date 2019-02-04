CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, undesiredErr } = require '../utils/utils'
{ getByUris } = require '../utils/entities'
{ randomWorkLabel, humanName, generateIsbn13, someOpenLibraryId  } = require '../fixtures/entities'
resolve = (entry)-> authReq 'post', '/api/entities?action=resolve', entry

describe 'entities:resolve:create-unresolved', ->
  it 'should throw when invalid isbn is passed', (done)->
    invalidIsbn = '9780000000000'
    resolve
      edition: [ { isbn: invalidIsbn } ]
      works: [ { labels: { en: randomWorkLabel() } } ]
      options: [ 'create' ]
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid isbn'
      done()
    .catch undesiredErr(done)

    return

  it 'should create unresolved edition, work and author (the trinity)', (done)->
    resolve
      edition: [ { isbn: generateIsbn13() } ]
      works: [ { labels: { en: randomWorkLabel() } } ]
      authors: [ { labels: { en: humanName() } } ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      result.edition[0].created.should.equal true
      result.authors[0].created.should.equal true
      result.works[0].created.should.equal true
      should(result.edition[0].uri).be.ok()
      should(result.works[0].uri).be.ok()
      should(result.authors[0].uri).be.ok()
      done()
    .catch done

    return

  it 'should create edition with title and isbn', (done)->
    editionLabel = randomWorkLabel()
    resolve
      edition: [ { isbn: generateIsbn13(), claims: { 'wdt:P1476': editionLabel } } ]
      works: [ { labels: { en: randomWorkLabel() } } ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      should(result.edition[0].uri).be.ok()
      { edition } = result

      getByUris edition[0].uri
      .get 'entities'
      .then (entities)->
        editionClaims = _.values(entities)[0].claims
        newEditionTitle = editionClaims['wdt:P1476'][0]

        should(editionClaims['wdt:P212'][0]).be.ok()
        newEditionTitle.should.equal editionLabel
        done()
    .catch done

    return

  it 'should add optional claims to created edition', (done)->
    frenchLang = 'wd:Q150'
    resolve
      edition: [ { isbn: generateIsbn13(), claims: { 'wdt:P407': [ frenchLang ]} } ]
      works: [ { labels: { en: randomWorkLabel() } } ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      should(result.edition[0].uri).be.ok()
      { edition } = result
      getByUris edition[0].uri
      .then (res)->
        newWorkClaimValue = _.values(res.entities)[0].claims['wdt:P407'][0]
        newWorkClaimValue.should.equal frenchLang
        done()
    .catch done

    return

  it 'should add optional claims to created works', (done)->
    olId = someOpenLibraryId 'work'
    resolve
      edition: [ { isbn: generateIsbn13() } ]
      works: [ { claims: { 'wdt:P648': [ olId ] }, labels: { en: randomWorkLabel() } } ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      should(result.edition[0].uri).be.ok()
      { works } = result
      getByUris works.map(_.property('uri'))
      .then (res)->
        newWorkClaimValue = _.values(res.entities)[0].claims['wdt:P648'][0]
        newWorkClaimValue.should.equal olId
        done()
    .catch done

    return

  it 'should add optional claims to created authors', (done)->
    olId = someOpenLibraryId 'author'
    resolve
      edition: [ { isbn: generateIsbn13() } ]
      works: [ { labels: { en: randomWorkLabel() } } ]
      authors: [ { claims: { 'wdt:P648': [ olId ] }, labels: { en: randomWorkLabel() } } ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      should(result.edition[0].uri).be.ok()
      { authors } = result
      getByUris authors.map(_.property('uri'))
      .then (res)->
        newWorkClaimValue = _.values(res.entities)[0].claims['wdt:P648'][0]
        newWorkClaimValue.should.equal olId
        done()
    .catch done

    return
