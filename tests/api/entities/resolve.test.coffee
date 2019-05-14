CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, undesiredRes, undesiredErr } = require '../utils/utils'
elasticsearchUpdateDelay = CONFIG.entitiesSearchEngine.elasticsearchUpdateDelay or 1000
{ createWork, createEdition, createHuman, someGoodReadsId, createWorkWithAuthor, generateIsbn13 } = require '../fixtures/entities'
{ addClaim } = require '../utils/entities'
{ ensureEditionExists, randomLabel, humanName } = require '../fixtures/entities'
resolve = (entries)->
  entries = _.forceArray entries
  authReq 'post', '/api/entities?action=resolve', { entries }

describe 'entities:resolve', ->
  it 'should throw when invalid isbn is passed', (done)->
    invalidIsbn = '9780000000000'
    resolve { edition: { isbn: invalidIsbn } }
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.startWith 'invalid isbn'
      done()
    .catch undesiredErr(done)

    return

  it 'should resolve an edition entry from an ISBN', (done)->
    rawIsbn = generateIsbn13()
    editionSeed = { isbn: rawIsbn }
    entry = { edition: editionSeed }
    ensureEditionExists "isbn:#{rawIsbn}"
    .then -> resolve entry
    .get 'entries'
    .then (entries)->
      entries[0].should.be.an.Object()
      entries[0].edition.uri.should.equal "isbn:#{rawIsbn}"
      done()
    .catch done

    return

  it 'should resolve multiple entries', (done)->
    rawIsbnA = generateIsbn13()
    rawIsbnB = generateIsbn13()
    entryA = { edition: { isbn: rawIsbnA } }
    entryB = { edition: { isbn: rawIsbnB } }
    Promise.all [
      ensureEditionExists "isbn:#{rawIsbnA}"
      ensureEditionExists "isbn:#{rawIsbnB}"
    ]
    .then -> resolve [ entryA, entryB ]
    .get 'entries'
    .then (entries)->
      entries[0].should.be.an.Object()
      entries[0].edition.uri.should.equal "isbn:#{rawIsbnA}"
      entries[1].should.be.an.Object()
      entries[1].edition.uri.should.equal "isbn:#{rawIsbnB}"
      done()
    .catch done

    return

  it 'should reject if key "edition" is missing', (done)->
    resolve {}
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.startWith 'missing edition in entry'
      done()
    .catch done

    return

  it 'should reject when no isbn is found', (done)->
    entry =
      edition: [ { claims: { 'wdt:P1476': randomLabel() } } ]
      works: [ { labels: { en: randomLabel() } } ]
    resolve entry
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.startWith 'no isbn found'
      done()
    .catch done

    return

  it 'should reject when claims key is not an array of objects', (done)->
    resolve
      edition: { isbn: generateIsbn13() }
      works: [ { claims: [ 'wdt:P31: wd:Q23' ] } ]
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.startWith 'invalid claims'
      done()
    .catch done

    return

  it 'should reject when claims value is invalid', (done)->
    resolve
      edition: { isbn: generateIsbn13() }
      works: [ { claims: { 'wdt:P50': [ 'not a valid entity uri' ] } } ]
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'invalid property value'
      done()
    .catch done

    return

  it 'should reject when claims key has an unknown property', (done)->
    unknownProp = 'wdt:P6'
    seed =
      isbn: generateIsbn13()
      claims: { "#{unknownProp}": [ 'wd:Q23' ] }
    resolve { edition: seed }
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal "property isn't whitelisted"
      done()
    .catch done

    return

describe 'entities:resolve:external-id', ->
  it 'should resolve wikidata work from external ids claim', (done)->
    resolve
      edition: { isbn: generateIsbn13() }
      works: [
        claims:
          'wdt:P1085': [ '28158' ]
      ]
    .get 'entries'
    .then (entries)->
      entries[0].works.should.be.an.Array()
      entries[0].works[0].should.be.an.Object()
      entries[0].works[0].uri.should.equal 'wd:Q151883'
      done()
    .catch done

    return

  it 'should resolve inventaire work from external ids claim', (done)->
    goodReadsId = someGoodReadsId()
    createWork()
    .tap (work)-> addClaim work.uri, 'wdt:P2969', goodReadsId
    .delay 10
    .then (work)->
      resolve
        edition: { isbn: generateIsbn13() }
        works: [ { claims: { 'wdt:P2969': [ goodReadsId ] } } ]
      .get 'entries'
      .then (entries)->
        entries[0].works.should.be.an.Array()
        entries[0].works[0].should.be.an.Object()
        entries[0].works[0].uri.should.equal work.uri
        done()
    .catch done

    return

  it 'should resolve wikidata author from external ids claim', (done)->
    resolve
      edition: { isbn: generateIsbn13() }
      authors: [
        claims:
          'wdt:P648': [ 'OL28127A' ]
      ]
    .get 'entries'
    .then (entries)->
      entries[0].authors.should.be.an.Array()
      entries[0].authors[0].should.be.an.Object()
      entries[0].authors[0].uri.should.equal 'wd:Q16867'
      done()
    .catch done

    return

  it 'should resolve inventaire author from external ids claim', (done)->
    goodReadsId = someGoodReadsId()
    createHuman()
    .delay 10
    .tap (author)-> addClaim author.uri, 'wdt:P2963', goodReadsId
    .delay 10
    .then (author)->
      resolve
        edition: { isbn: generateIsbn13() }
        authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
      .get 'entries'
      .then (entries)->
        entries[0].authors.should.be.an.Array()
        entries[0].authors[0].should.be.an.Object()
        entries[0].authors[0].uri.should.equal author.uri
        done()
    .catch done

    return

describe 'entities:resolve:in-context', ->
  it 'should resolve work from work label and author with external ids claim', (done)->
    goodReadsId = someGoodReadsId()
    missingWorkLabel = randomLabel()
    otherWorkLabel = randomLabel()
    createHuman()
    .delay 10
    .tap (author)-> addClaim author.uri, 'wdt:P2963', goodReadsId
    .delay 10
    .then (author)->
      Promise.all [
        createWorkWithAuthor author, missingWorkLabel
        createWorkWithAuthor author, otherWorkLabel
      ]
      .spread (work, otherWork)->
        resolve
          edition: { isbn: generateIsbn13() }
          works: [ { labels: { en: missingWorkLabel } } ]
          authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
        .get 'entries'
        .then (entries)->
          should(entries[0].works[0].uri).be.ok()
          done()
    .catch done

    return

  it 'should not resolve work from resolved author when author have several works with same labels', (done)->
    goodReadsId = someGoodReadsId()
    workLabel = randomLabel()
    createHuman()
    .delay 10
    .tap (author)-> addClaim author.uri, 'wdt:P2963', goodReadsId
    .delay 10
    .then (author)->
      Promise.all [
        createWorkWithAuthor author, workLabel
        createWorkWithAuthor author, workLabel
      ]
      .spread (work, otherWork)->
        entry =
          edition: { isbn: generateIsbn13() }
          works: [ { labels: { en: workLabel } } ]
          authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
        resolve entry
        .get 'entries'
        .then (entries)->
          should(entries[0].works[0].uri).not.be.ok()
          done()
    .catch done

    return

  it 'should resolve author from inv author with same label, and an inv work with external id', (done)->
    goodReadsId = someGoodReadsId()
    workLabel = randomLabel()
    createHuman()
    .delay 10
    .then (author)->
      createWorkWithAuthor author, workLabel
      .tap (work)-> addClaim work.uri, 'wdt:P2969', goodReadsId
      .then (work)->
        entry =
          edition: { isbn: generateIsbn13() }
          works: [ { claims: { 'wdt:P2969': [ goodReadsId ] } } ]
          authors: [ { labels: author.labels } ]
        resolve entry
        .get 'entries'
        .then (entries)->
          should(entries[0].works[0].uri).be.ok()
          should(entries[0].authors[0].uri).be.ok()
          done()
    .catch done

    return

describe 'entities:resolve:on-labels', ->
  it 'should resolve author and work pair by searching for exact labels', (done)->
    createHuman()
    .then (author)->
      workLabel = randomLabel()
      authorLabel = author.labels.en
      createWorkWithAuthor author, workLabel
      .delay elasticsearchUpdateDelay # update elasticSearch
      .then (work)->
        resolve basicEntry(workLabel, authorLabel)
        .get 'entries'
        .then (entries)->
          entries[0].works[0].uri.should.equal work.uri
          entries[0].authors[0].uri.should.equal author.uri
          done()
    .catch done

    return

  it 'should not resolve when several works exist', (done)->
    createHuman()
    .then (author)->
      createHuman { labels: author.labels }
      .then (sameLabelAuthor)->
        workLabel = randomLabel()
        Promise.all [
          createWorkWithAuthor author, workLabel
          createWorkWithAuthor sameLabelAuthor, workLabel
        ]
        .delay elasticsearchUpdateDelay # update elasticSearch
        .then (works)->
          resolve basicEntry(workLabel, author.labels.en)
          .get 'entries'
          .then (entries)->
            should(entries[0].works[0].uri).not.be.ok()
            should(entries[0].authors[0].uri).not.be.ok()
            done()
    .catch done

    return

basicEntry = (workLabel, authorLabel) ->
  edition: { isbn: generateIsbn13() },
  works: [ { labels: { en: workLabel } } ],
  authors: [ { labels: { en: authorLabel } } ]
