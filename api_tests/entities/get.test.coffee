CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ undesiredErr, undesiredRes } = require '../utils/utils'
{ ensureEditionExists, createWorkWithAuthor, createEditionWithWorkAuthorAndSerie } = require '../fixtures/entities'
{ getByUris } = require '../utils/entities'
endpointBase = '/api/entities?action=by-uris&uris='
workWithAuthorPromise = createWorkWithAuthor()

describe 'entities:get:by-uris', ->
  it 'should reject invalid uri', (done)->
    invalidUri = 'bla'
    getByUris invalidUri
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.startWith 'invalid uri'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject uri with wrong prefix', (done)->
    invalidUri = 'twitter:isevil'
    getByUris invalidUri
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.startWith 'invalid uri'
      done()
    .catch undesiredErr(done)

    return

  it 'should accept inventaire uri', (done)->
    workWithAuthorPromise
    .then (work)->
      getByUris work.uri
      .then (res)->
        res.entities[work.uri].should.be.an.Object()
        done()
    .catch undesiredErr(done)

    return

  it 'should return uris not found', (done)->
    fakeUri = 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    getByUris fakeUri
    .then (res)->
      res.notFound.should.deepEqual [ fakeUri ]
      done()
    .catch undesiredErr(done)

    return

  it 'should accept wikidata uri', (done)->
    validWdUri = 'wd:Q2300248'
    ensureEditionExists validWdUri
    .then -> getByUris validWdUri
    .then (res)->
      entity = res.entities[validWdUri]
      entity.uri.should.equal validWdUri
      done()
    .catch undesiredErr(done)

    return

  it 'should accept strict ISBN 13 syntax', (done)->
    isbn13Uri = 'isbn:9782845652217'
    ensureEditionExists isbn13Uri
    .then -> getByUris isbn13Uri
    .then (res)->
      entity = res.entities[isbn13Uri]
      entity.uri.should.equal isbn13Uri
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
