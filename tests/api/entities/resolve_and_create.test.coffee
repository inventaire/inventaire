CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, adminReq, getUser, undesiredErr } = require '../utils/utils'
{ getByUris, getHistory } = require '../utils/entities'
{ randomLabel, humanName, generateIsbn13, someGoodReadsId, ensureEditionExists } = require '../fixtures/entities'
resolveAndCreate = (entry)->
  authReq 'post', '/api/entities?action=resolve',
    entries: [ entry ]
    create: true

describe 'entities:resolve:create-unresolved', ->
  it 'should create unresolved works with resolved authors', (done)->
    resolve
      edition: { isbn: generateIsbn13() }
      works: [ { labels: { en: randomLabel() } } ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      should(result.works[0].uri).be.ok()
      done()
    .catch done

    return

  it 'should throw when invalid isbn is passed', (done)->
    invalidIsbn = '9780000000000'
    resolveAndCreate
      edition: [ { isbn: invalidIsbn } ]
      works: [ { labels: { en: randomLabel() } } ]
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid isbn'
      done()
    .catch undesiredErr(done)

    return

  it 'should create unresolved edition, work and author (the trinity)', (done)->
    resolveAndCreate
      edition: [ { isbn: generateIsbn13() } ]
      works: [ { labels: { en: randomLabel() } } ]
      authors: [ { labels: { en: humanName() } } ]
    .get 'results'
    .then (results)->
      result = results[0]
      result.edition.created.should.equal true
      result.authors[0].created.should.equal true
      result.works[0].created.should.equal true
      should(result.edition.uri).be.ok()
      should(result.works[0].uri).be.ok()
      should(result.authors[0].uri).be.ok()
      done()
    .catch undesiredErr(done)

    return

  it 'should resolve and not create an existing edition', (done)->
    rawIsbn = generateIsbn13()
    editionSeed = { isbn: rawIsbn }
    ensureEditionExists "isbn:#{rawIsbn}"
    .then -> resolveAndCreate { edition: [ editionSeed ] }
    .get 'results'
    .then (results)->
      results[0].should.be.an.Object()
      results[0].edition.uri.should.equal "isbn:#{rawIsbn}"
      done()
    .catch done

    return

  it 'should create edition with title and isbn', (done)->
    editionLabel = randomLabel()
    resolveAndCreate
      edition: [ { isbn: generateIsbn13(), claims: { 'wdt:P1476': editionLabel } } ]
      works: [ { labels: { en: randomLabel() } } ]
    .get 'results'
    .then (results)->
      result = results[0]
      should(result.edition.uri).be.ok()
      { edition } = result

      getByUris edition.uri
      .get 'entities'
      .then (entities)->
        editionClaims = _.values(entities)[0].claims
        newEditionTitle = editionClaims['wdt:P1476'][0]

        should(editionClaims['wdt:P212'][0]).be.ok()
        newEditionTitle.should.equal editionLabel
        done()
    .catch undesiredErr(done)

    return

  it 'should add optional claims to created edition', (done)->
    frenchLang = 'wd:Q150'
    resolveAndCreate
      edition: [ { isbn: generateIsbn13(), claims: { 'wdt:P407': [ frenchLang ] } } ]
      works: [ { labels: { en: randomLabel() } } ]
    .get 'results'
    .then (results)->
      result = results[0]
      should(result.edition.uri).be.ok()
      { edition } = result
      getByUris edition.uri
      .get 'entities'
      .then (entities)->
        newWorkClaimValue = _.values(entities)[0].claims['wdt:P407'][0]
        newWorkClaimValue.should.equal frenchLang
        done()
    .catch undesiredErr(done)

    return

  it 'should add optional claims to created works', (done)->
    goodReadsId = someGoodReadsId()
    resolveAndCreate
      edition: [ { isbn: generateIsbn13() } ]
      works: [ { claims: { 'wdt:P2969': [ goodReadsId ] }, labels: { en: randomLabel() } } ]
    .get 'results'
    .then (results)->
      result = results[0]
      should(result.edition.uri).be.ok()
      { works } = result
      getByUris works.map(_.property('uri'))
      .get 'entities'
      .then (entities)->
        newWorkClaimValue = _.values(entities)[0].claims['wdt:P2969'][0]
        newWorkClaimValue.should.equal goodReadsId
        done()
    .catch undesiredErr(done)

    return

  it 'should add optional claims to created authors', (done)->
    goodReadsId = someGoodReadsId()
    resolveAndCreate
      edition: [ { isbn: generateIsbn13() } ]
      works: [ { labels: { en: randomLabel() } } ]
      authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] }, labels: { en: humanName() } } ]
    .get 'results'
    .then (results)->
      result = results[0]
      should(result.edition.uri).be.ok()
      { authors } = result
      getByUris authors.map(_.property('uri'))
      .get 'entities'
      .then (entities)->
        newWorkClaimValue = _.values(entities)[0].claims['wdt:P2963'][0]
        newWorkClaimValue.should.equal goodReadsId
        done()
    .catch undesiredErr(done)

    return

  it 'should add a batch timestamp to patches', (done)->
    startTime = Date.now()
    entry =
      edition: [ { isbn: generateIsbn13() } ]
      works: [ { claims: { 'wdt:P2969': [ someGoodReadsId() ] }, labels: { en: humanName() } } ]
    resolveAndCreate entry
    .get 'results'
    .then (results)->
      result = results[0]
      { uri: editionUri } = result.edition
      editionId = editionUri.split(':')[1]
      getHistory editionId
      .get 'patches'
      .then (patches)->
        patch = patches[0]
        patch.batch.should.be.a.Number()
        patch.batch.should.above startTime
        patch.batch.should.below Date.now()
        done()
    .catch undesiredErr(done)

    return

  it 'should add created authors to created works', (done)->
    resolveAndCreate
      edition: [ { isbn: generateIsbn13() } ]
      works: [ { labels: { en: randomWorkLabel() } } ]
      authors: [ { labels: { en: humanName() } } ]
    .get 'results'
    .then (results)->
      result = results[0]
      workUri = result.works[0].uri
      getByUris workUri
      .get 'entities'
      .then (entities)->
        work = entities[workUri]
        workAuthors = work.claims['wdt:P50']
        workAuthors.includes(result.authors[0].uri).should.be.true()
      done()
    .catch undesiredErr(done)

    return
