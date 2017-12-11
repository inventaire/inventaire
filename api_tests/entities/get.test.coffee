CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, nonAuthReq, undesiredErr } = require '../utils/utils'
{ getByUris } = require '../utils/entities'
{ ensureEditionExists } = require '../fixtures/entities'

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
