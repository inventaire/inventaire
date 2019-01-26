CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, undesiredRes, undesiredErr } = require '../utils/utils'
{ createWork, createEdition, createHuman, someOpenLibraryId, createWorkWithAuthor } = require '../fixtures/entities'
{ addClaim } = require '../utils/entities'
{ ensureEditionExists, randomWorkLabel, humanName } = require '../fixtures/entities'
resolve = (entry)-> authReq 'post', '/api/entities?action=resolve', entry

describe 'entities:resolve', ->
  it 'should find an edition from an ISBN', (done)->
    ensureEditionExists 'isbn:9782203399303'
    .then -> resolve { edition: { isbn: '9782203399303' } }
    .get 'result'
    .then (result)->
      result.should.be.an.Object()
      result.edition.uri.should.equal 'isbn:9782203399303'
      done()

    .catch done

    return

  it 'should reject if key "edition" is missing', (done)->
    resolve {}
    .catch (err)->
      err.body.status_verbose.should.startWith 'missing parameter'
      done()

    .catch done

    return

  it 'should reject when claims key is not an array of objects', (done)->
    resolve
      edition:
        claims: [ 'wdt:P31: wd:Q23' ]
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid claims'
      done()

    .catch done

    return

  it 'should warn when claims key has an unknown property', (done)->
    unknownProp = 'wdt:P6'
    resolve
      edition:
        isbn: '9782203399303'
        claims: { "#{unknownProp}": [ 'wd:Q23' ] }
    .then (res)->
      res.warnings.should.be.an.Object()
      res.warnings.resolver.should.deepEqual [ "unknown property: #{unknownProp}" ]
      done()
    .catch done

    return

  it 'should find wikidata work from external ids claims', (done)->
    edition = { isbn: '9782203399303' }
    work =
      claims:
        'wdt:P648': [ 'OL52556W' ]
        'wdt:P1085': [ '28158' ]
    resolve { edition, works: [ work ] }
    .get 'result'
    .then (result)->
      result.works.should.be.an.Array()
      result.works[0].should.be.an.Object()
      result.works[0].uri.should.equal 'wd:Q151883'
      done()
    .catch done

    return

  it 'should find inventaire work from external ids claims', (done)->
    olId = someOpenLibraryId 'work'
    entry =
      edition: { isbn: '9782203399303' }
      works: [ { claims: { 'wdt:P648': [ olId ] } } ]
    createWork()
    .tap (work)-> addClaim work.uri, 'wdt:P648', olId
    .delay 10
    .then (work)->
      resolve entry
      .get 'result'
      .then (result)->
        result.works.should.be.an.Array()
        result.works[0].should.be.an.Object()
        result.works[0].uri.should.equal work.uri
        done()
    .catch done

    return

  it 'should find wikidata author from external ids claims', (done)->
    edition = { isbn: '9782203399303' }
    author =
      claims:
        'wdt:P648': [ 'OL28127A' ]
    resolve { edition, authors: [ author ] }
    .get 'result'
    .then (result)->
      result.authors.should.be.an.Array()
      result.authors[0].should.be.an.Object()
      result.authors[0].uri.should.equal 'wd:Q16867'
      done()
    .catch done

    return

  it 'should find inventaire author from external ids claims ', (done)->
    olId = someOpenLibraryId 'author'
    entry =
      edition: { isbn: '9782203399303' }
      authors: [ { claims: { 'wdt:P648': [ olId ] } } ]
    createHuman()
    .delay 10
    .tap (author)-> addClaim author.uri, 'wdt:P648', olId
    .delay 10
    .then (author)->
      resolve entry
      .get 'result'
      .then (result)->
        result.authors.should.be.an.Array()
        result.authors[0].should.be.an.Object()
        result.authors[0].uri.should.equal author.uri
        done()
    .catch done

    return

describe 'entities:resolve in context', ->
  it 'should resolve work from inv work label and inv author with external ids', (done)->
    olId = someOpenLibraryId 'author'
    missingWorkLabel = randomWorkLabel()
    otherWorkLabel = randomWorkLabel()
    entry =
      edition: { isbn: '9782203399303' }
      works: [ { labels: { en: missingWorkLabel } } ]
      authors: [ { claims: { 'wdt:P648': [ olId ] } } ]
    createHuman()
    .delay 10
    .tap (author)-> addClaim author.uri, 'wdt:P648', olId
    .then (author)->
      Promise.all [
        createWorkWithAuthor author, missingWorkLabel
        createWorkWithAuthor author, otherWorkLabel
      ]
      .spread (work, otherWork)->
        resolve entry
        .get 'result'
        .then (result)->
          result.works[0].uri.should.equal work.uri
          done()
    .catch done

    return

  it 'should resolve work from resolved author when author have several works with same label', (done)->
    olId = someOpenLibraryId 'work'
    workLabel = randomWorkLabel()
    createHuman()
    .delay 10
    .then (author)->
      Promise.all [
        createWorkWithAuthor author, workLabel
        createWorkWithAuthor author, workLabel
      ]
      .spread (work, otherWork)->
        entry =
          edition: { isbn: '9782203399303' }
          works: [ { labels: { en: workLabel } } ]
          authors: [ { claims: { 'wdt:P648': [ olId ] } } ]
        resolve entry
        .get 'result'
        .then (result)->
          should(result.authors[0].uri).not.be.ok()
          done()
    .catch done

    return

  it 'should resolve author from inv author label and inv work with external id', (done)->
    olId = someOpenLibraryId 'work'
    workLabel = randomWorkLabel()
    createHuman()
    .delay 10
    .then (author)->
      createWorkWithAuthor author, workLabel
      .tap (work)-> addClaim work.uri, 'wdt:P648', olId
      .then (work)->
        entry =
          edition: { isbn: '9782203399403' }
          works: [ { claims: { 'wdt:P648': [ olId ] } } ]
          authors: [ { labels: author.labels } ]
        resolve entry
        .get 'result'
        .then (result)->
          result.authors[0].uri.should.equal author.uri
          done()
    .catch done

    return

describe 'entities:resolve from labels', ->
  it 'should resolve work & author when inv author & inv work labels exists', (done)->
    createHuman()
    .then (author)->
      workLabel = randomWorkLabel()
      createWorkWithAuthor author, workLabel
      .delay 3500
      .then (work)->
        entry =
          edition: { isbn: '9782203399303' }
          works: [ { labels: work.labels } ]
          authors: [ { labels: author.labels } ]
        resolve entry
        .get 'result'
        .then (result)->
          result.works[0].uri.should.equal work.uri
          result.authors[0].uri.should.equal author.uri
          done()
    .catch done

    return

  it 'should not resolve when several inv authors & inv works labels exist', (done)->
    createHuman()
    .then (author)->
      authReq 'post', '/api/entities?action=create',
        labels: author.labels
        claims: { 'wdt:P31': [ 'wd:Q5' ] }
      .then (sameLabelAuthor)->
        workLabel = randomWorkLabel()
        Promise.all [
          createWorkWithAuthor author, workLabel
          createWorkWithAuthor sameLabelAuthor, workLabel
        ]
        .delay 3500
        .then (works)->
          entry =
            edition: { isbn: '9782203399303' }
            works: [ { labels: { en: workLabel } } ]
            authors: [ { labels: author.labels } ]
          resolve entry
          .get 'result'
          .then (result)->
            should(result.works[0].uri).not.be.ok()
            should(result.authors[0].uri).not.be.ok()
            done()
    .catch done

    return
