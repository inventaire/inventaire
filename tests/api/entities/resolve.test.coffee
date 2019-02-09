CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, undesiredRes, undesiredErr } = require '../utils/utils'
{ createWork, createEdition, createHuman, someOpenLibraryId, createWorkWithAuthor, generateIsbn13 } = require '../fixtures/entities'
{ addClaim } = require '../utils/entities'
{ ensureEditionExists, randomWorkLabel, humanName } = require '../fixtures/entities'
resolve = (entry)-> authReq 'post', '/api/entities?action=resolve', entry

describe 'entities:resolve', ->
  it 'should resolve an edition from an ISBN', (done)->
    ensureEditionExists 'isbn:9782203399303'
    .then -> resolve { edition: [ { isbn: '9782203399303' } ] }
    .get 'result'
    .then (result)->
      result.should.be.an.Object()
      result.edition[0].uri.should.startWith 'isbn:'
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

  it 'should reject when no isbn is found', (done)->
    entry =
      edition: [ { claims: { 'wdt:P1476': randomWorkLabel() }} ]
      works: [ { labels: { en: randomWorkLabel() } } ]
    resolve entry
    .catch (err)->
      err.body.status_verbose.should.startWith 'no isbn found'
      done()
    .catch done

    return

  it 'should reject when claims key is not an array of objects', (done)->
    resolve
      edition: [ { isbn: generateIsbn13() } ]
      works: [ { claims: [ 'wdt:P31: wd:Q23' ] } ]
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid claims'
      done()
    .catch done

    return

  it 'should warn when claims key has an unknown property', (done)->
    unknownProp = 'wdt:P6'
    resolve
      edition: [
        isbn: generateIsbn13()
        claims: { "#{unknownProp}": [ 'wd:Q23' ] }
      ]
    .then (res)->
      res.warnings.should.be.an.Object()
      res.warnings.resolver.should.deepEqual [ "unknown property: #{unknownProp}" ]
      done()
    .catch done

    return

describe 'entities:resolve:external-id', ->
  it 'should resolve wikidata work from external ids claim', (done)->
    edition = [ { isbn: generateIsbn13() } ]
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

  it 'should resolve inventaire work from external ids claim', (done)->
    olId = someOpenLibraryId 'work'
    entry =
      edition: [ { isbn: generateIsbn13() } ]
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

  it 'should resolve wikidata author from external ids claim', (done)->
    edition = [ { isbn: generateIsbn13() } ]
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

  it 'should resolve inventaire author from external ids claim', (done)->
    olId = someOpenLibraryId 'author'
    entry =
      edition: [ { isbn: generateIsbn13() } ]
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

describe 'entities:resolve:in-context', ->
  it 'should resolve work from work label and author with external ids claim', (done)->
    olId = someOpenLibraryId 'author'
    missingWorkLabel = randomWorkLabel()
    otherWorkLabel = randomWorkLabel()
    entry =
      edition: [ { isbn: generateIsbn13() } ]
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
          should(result.works[0].uri).be.ok()
          should(result.works[0].uri).be.ok()
          done()
    .catch done

    return

  it 'should not resolve work from resolved author when author have several works with same label', (done)->
    olId = someOpenLibraryId 'work'
    workLabel = randomWorkLabel()
    createHuman()
    .delay 10
    .tap (author)-> addClaim author.uri, 'wdt:P648', olId
    .delay 10
    .then (author)->
      Promise.all [
        createWorkWithAuthor author, workLabel
        createWorkWithAuthor author, workLabel
      ]
      .spread (work, otherWork)->
        entry =
          edition: [ { isbn: generateIsbn13() } ]
          works: [ { labels: { en: workLabel } } ]
          authors: [ { claims: { 'wdt:P648': [ olId ] } } ]
        resolve entry
        .get 'result'
        .then (result)->
          # if created is true, work was created, not resolved
          should(result.works[0].uri).not.be.ok()
          should(result.authors[0].uri).be.ok()
          done()
    .catch done

    return

  it 'should resolve author from inv author with same label, and an inv work with external id', (done)->
    olId = someOpenLibraryId 'work'
    workLabel = randomWorkLabel()
    createHuman()
    .delay 10
    .then (author)->
      createWorkWithAuthor author, workLabel
      .tap (work)-> addClaim work.uri, 'wdt:P648', olId
      .then (work)->
        entry =
          edition: [ { isbn: generateIsbn13() } ]
          works: [ { claims: { 'wdt:P648': [ olId ] } } ]
          authors: [ { labels: author.labels } ]
        resolve entry
        .get 'result'
        .then (result)->
          result.authors[0].uri.should.equal author.uri
          done()
    .catch done

    return

describe 'entities:resolve:from-labels', ->
  it 'should resolve work & author from inv author & inv work labels', (done)->
    createHuman()
    .then (author)->
      workLabel = randomWorkLabel()
      createWorkWithAuthor author, workLabel
      .delay 3500
      .then (work)->
        entry =
          edition: [ { isbn: generateIsbn13() } ]
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

  it 'should reject when several authors/works pairs exist', (done)->
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
            edition: [ { isbn: generateIsbn13() } ]
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
