CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
# { Promise } = __.require 'lib', 'promises'
{ authReq, undesiredRes, undesiredErr } = require '../utils/utils'
{ createWork, createEdition, createHuman, someOpenLibraryId } = require '../fixtures/entities'
{ addClaim } = require '../utils/entities'
{ ensureEditionExists } = require '../fixtures/entities'
resolve = (entry)-> authReq 'post', '/api/entities?action=resolve', entry

describe 'entities:resolve', ->
  it 'should find an edition from an ISBN', (done)->
    ensureEditionExists 'isbn:9782203399303'
    .then -> resolve { edition: { isbn: '9782203399303' } }
    .get 'result'
    .then (result)->
      result.should.be.an.Object()
      result.edition.should.equal 'isbn:9782203399303'
      done()

    .catch done

    return

  it 'should warn when entries have unknown properties', (done)->
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

  it 'should find wikidata work from external ids claims ', (done)->
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

  it 'should find inventaire work from external ids claims ', (done)->
    olId = someOpenLibraryId 'W'
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

  it 'should find wikidata author from external ids claims ', (done)->
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
    olId = someOpenLibraryId 'A'
    entry =
      edition: { isbn: '9782203399303' }
      authors: [ { claims: { 'wdt:P648': [ olId ] } } ]
    createHuman()
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
