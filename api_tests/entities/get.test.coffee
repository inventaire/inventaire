CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ undesiredErr, undesiredRes } = require '../utils/utils'
{ getByUris } = require '../utils/entities'
{ ensureEditionExists, createWorkWithAuthor, createEditionWithWorkAuthorAndSerie } = require '../fixtures/entities'
{ getByUris } = require '../utils/entities'
endpointBase = '/api/entities?action=by-uris&uris='
workWithAuthorPromise = createWorkWithAuthor()

describe 'entities:get:by-uris', ->
  it 'should accept alternative ISBN 13 syntax', (done)->
    isbn13h = '978-2-84565-221-7'
    isbn13Uri = 'isbn:9782845652217'
    isbn13hUri = "isbn:#{isbn13h}"
    ensureEditionExists isbn13Uri
    .then -> getByUris isbn13hUri
    .then (res)->
      { entities, redirects } = res
      canonicalUri = redirects[isbn13hUri]
      canonicalUri.should.equal isbn13Uri
      entity = entities[canonicalUri]
      entity.should.be.an.Object()
      entity.type.should.equal 'edition'
      entity.uri.should.equal canonicalUri
      done()
    .catch undesiredErr(done)

    return

  it 'should accept alternative ISBN 10 syntax', (done)->
    isbn13h = '978-2-84565-221-7'
    isbn13Uri = 'isbn:9782845652217'
    isbn10hUri = 'isbn:2-84565-221-6'
    ensureEditionExists isbn13Uri
    .then -> getByUris isbn10hUri
    .then (res)->
      { entities, redirects } = res
      canonicalUri = redirects[isbn10hUri]
      canonicalUri.should.equal isbn13Uri
      entity = entities[canonicalUri]
      entity.should.be.an.Object()
      entity.type.should.equal 'edition'
      entity.uri.should.equal canonicalUri
      done()
    .catch undesiredErr(done)

    return

  it 'should return uris not found', (done)->
    fakeUri = 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    workWithAuthorPromise
    .then (work)->
      getByUris [ fakeUri, work.uri ]
      .then (res)->
        res.entities[work.uri].should.be.an.Object()
        res.notFound.should.deepEqual [ fakeUri ]
        done()
    .catch undesiredErr(done)

    return

  describe 'alias URIs', ->
    it 'should accept twitter URIs', (done)->
      aliasUri = 'twitter:bouletcorp'
      getByUris aliasUri
      .then (res)->
        { entities, redirects } = res
        canonicalUri = redirects[aliasUri]
        canonicalUri.should.equal 'wd:Q1524522'
        entity = entities[canonicalUri]
        entity.should.be.an.Object()
        entity.type.should.equal 'human'
        entity.uri.should.equal canonicalUri
        done()
      .catch undesiredErr(done)

      return

    it 'should accept alias URIs with inexact case', (done)->
      aliasUri = 'twitter:Bouletcorp'
      getByUris aliasUri
      .then (res)->
        { entities, redirects } = res
        canonicalUri = redirects[aliasUri]
        canonicalUri.should.equal 'wd:Q1524522'
        done()
      .catch undesiredErr(done)

      return

    it 'should accept Wikimedia project URIs', (done)->
      aliasUri = 'frwiki:Lucien_Suel'
      getByUris aliasUri
      .then (res)->
        { entities, redirects } = res
        canonicalUri = redirects[aliasUri]
        canonicalUri.should.equal 'wd:Q3265721'
        entity = entities[canonicalUri]
        entity.should.be.an.Object()
        entity.type.should.equal 'human'
        entity.uri.should.equal canonicalUri
        done()
      .catch undesiredErr(done)

      return

    it 'should accept Wikimedia project URIs with spaces', (done)->
      aliasUri = 'eswikiquote:J. K. Rowling'
      getByUris aliasUri
      .then (res)->
        { entities, redirects } = res
        canonicalUri = redirects[aliasUri]
        canonicalUri.should.equal 'wd:Q34660'
        entity = entities[canonicalUri]
        entity.should.be.an.Object()
        entity.type.should.equal 'human'
        entity.uri.should.equal canonicalUri
        done()
      .catch undesiredErr(done)

      return

  describe 'relatives', ->
    it "should accept a 'relatives' parameter", (done)->
      workWithAuthorPromise
      .then (work)->
        { uri:workUri } = work
        authorUri = work.claims['wdt:P50'][0]
        getByUris workUri, 'wdt:P50'
        .then (res)->
          res.entities[workUri].should.be.an.Object()
          res.entities[authorUri].should.be.an.Object()
          done()
      .catch undesiredErr(done)

      return

    it "should reject a non-whitelisted 'relatives' parameter", (done)->
      workWithAuthorPromise
      .then (work)->
        { uri:workUri } = work
        getByUris workUri, 'wdt:P31'
        .then undesiredRes(done)
        .catch (err)->
          err.statusCode.should.equal 400
          err.body.status_verbose.should.equal 'invalid relative: wdt:P31'
          done()
      .catch undesiredErr(done)

      return

    it 'should be able to include the works, authors, and series of an edition', (done)->
      createEditionWithWorkAuthorAndSerie()
      .get 'uri'
      .then (editionUri)->
        getByUris editionUri, 'wdt:P50|wdt:P179|wdt:P629'
        .then (res)->
          edition = res.entities[editionUri]
          edition.should.be.an.Object()

          workUri = edition.claims['wdt:P629'][0]
          work = res.entities[workUri]
          work.should.be.an.Object()

          authorUri = work.claims['wdt:P50'][0]
          author = res.entities[authorUri]
          author.should.be.an.Object()

          serieUri = work.claims['wdt:P179'][0]
          serie = res.entities[serieUri]
          serie.should.be.an.Object()

          done()

      .catch undesiredErr(done)

      return
