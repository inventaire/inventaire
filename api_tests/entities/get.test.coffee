CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, nonAuthReq, undesiredErr, undesiredRes } = require '../utils/utils'
{ getByUris } = require '../utils/entities'
{ ensureEditionExists, createWorkWithAuthor } = require '../fixtures/entities'
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
        nonAuthReq 'get', "#{endpointBase}#{workUri}&relatives=wdt:P50"
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
        nonAuthReq 'get', "#{endpointBase}#{workUri}&relatives=wdt:P31"
        .then undesiredRes(done)
        .catch (err)->
          err.statusCode.should.equal 400
          err.body.status_verbose.should.equal 'invalid relative: wdt:P31'
          done()
      .catch undesiredErr(done)

      return
