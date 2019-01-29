CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, undesiredErr } = require '../utils/utils'
{ getByUris } = require '../utils/entities'
{ randomWorkLabel, humanName, generateIsbn13  } = require '../fixtures/entities'
resolve = (entry)-> authReq 'post', '/api/entities?action=resolve', entry

describe 'entities:resolve:create-unresolved', ->
  it 'should create unresolved works with resolved authors', (done)->
    resolve
      edition: { isbn: generateIsbn13() }
      works: [ { labels: { en: randomWorkLabel() } } ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      should(result.works[0].uri).be.ok()
      done()
    .catch done

    return

  it 'should throw when invalid isbn is passed', (done)->
    invalidIsbn = '9780000000000'
    resolve
      edition: { isbn: invalidIsbn }
      works: [ { labels: { en: randomWorkLabel() } } ]
      options: [ 'create' ]
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid isbn'
      done()
    .catch undesiredErr(done)

    return

  it 'should create unresolved edition, work and author (the trinity)', (done)->
    resolve
      edition: { isbn: generateIsbn13() }
      works:   [ { labels: { en: randomWorkLabel() } } ]
      authors: [ { labels: { en: humanName() } } ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      result.edition.created.should.equal true
      result.authors[0].created.should.equal true
      result.works[0].created.should.equal true
      should(result.edition.uri).be.ok()
      should(result.works[0].uri).be.ok()
      should(result.authors[0].uri).be.ok()
      done()
    .catch done

    return

  it 'should create edition title with favorising edition title claim value', (done)->
    editionLabel = randomWorkLabel()
    resolve
      edition:
        isbn: generateIsbn13(),
        claims: { 'wdt:P1476': [ editionLabel ] }
      works: [ { labels: { en: randomWorkLabel() } } ]
      options: [ 'create' ]
    .get 'result'
    .then (result)->
      should(result.edition.uri).be.ok()
      { edition } = result

      getByUris [ edition.uri ]
      .then (res)->
        newEditionTitle = _.values(res.entities)[0].claims['wdt:P1476'][0]
        newEditionTitle.should.equal editionLabel
        done()
    .catch done

    return
