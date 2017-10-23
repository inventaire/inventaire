CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, nonAuthReq, undesiredErr } = require '../utils/utils'

describe 'entities:get:by-uris', ->
  it 'should accept alternative ISBN 13 syntax', (done)->
    isbn13h = '978-2-84565-221-7'
    isbn13Uri = 'isbn:9782845652217'
    isbn13hUri = "isbn:#{isbn13h}"
    createEditionEntity isbn13h
    .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{isbn13hUri}"
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
    createEditionEntity isbn13h
    .then -> nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{isbn10hUri}"
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
    nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{aliasUri}"
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
    nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{aliasUri}"
    .then (res)->
      { entities, redirects } = res
      canonicalUri = redirects[aliasUri]
      canonicalUri.should.equal 'wd:Q1524522'
      done()
    .catch undesiredErr(done)

    return

  it 'should accept Wikimedia project URIs', (done)->
    aliasUri = 'frwiki:Lucien_Suel'
    nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{aliasUri}"
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
    nonAuthReq 'get', "/api/entities?action=by-uris&uris=#{aliasUri}"
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

# Make sure the entity for this ISBN exist
createEditionEntity = (isbn13h)->
  authReq 'post', '/api/entities?action=create',
    labels: { de: 'moin moin' }
    claims: { 'wdt:P31': [ 'wd:Q571' ] }
  .then (workEntity)->
    authReq 'post', '/api/entities?action=create',
      claims:
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P629': [ workEntity.uri ]
        'wdt:P1476': [ _.values(workEntity.labels)[0] ]
        'wdt:P212': [ isbn13h ]
  .catch (err)->
    # If it already exist, it's cool
    if err.body.status_verbose is 'this property value is already used'
      return
    else
      throw err
