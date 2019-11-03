CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, adminReq, getUser, undesiredErr, undesiredRes } = __.require 'apiTests', 'utils/utils'
{ getByUris, getHistory } = __.require 'apiTests', 'utils/entities'
{ randomLabel, humanName, generateIsbn13, someGoodReadsId, ensureEditionExists } = __.require 'apiTests', 'fixtures/entities'

resolveAndCreate = (entry)->
  authReq 'post', '/api/entities?action=resolve',
    entries: [ entry ]
    create: true

describe 'entities:resolve:create-unresolved', ->
  it 'should create unresolved edition, work and author (the trinity)', (done)->
    resolveAndCreate
      edition: { isbn: generateIsbn13() }
      works: [ { labels: { en: randomLabel() } } ]
      authors: [ { labels: { en: humanName() } } ]
    .get 'entries'
    .then (entries)->
      result = entries[0]
      result.edition.created.should.be.true()
      result.authors[0].created.should.be.true()
      result.works[0].created.should.be.true()
      should(result.edition.uri).be.ok()
      should(result.works[0].uri).be.ok()
      should(result.authors[0].uri).be.ok()
      done()
    .catch undesiredErr(done)

    return

  it 'should resolve and not create an existing edition', (done)->
    rawIsbn = generateIsbn13()
    ensureEditionExists "isbn:#{rawIsbn}"
    .then ->  resolveAndCreate { edition: { isbn: rawIsbn } }
    .get 'entries'
    .then (entries)->
      entries[0].should.be.an.Object()
      entries[0].edition.uri.should.equal "isbn:#{rawIsbn}"
      done()
    .catch done

    return

  it 'should create edition with title and isbn', (done)->
    editionLabel = randomLabel()
    resolveAndCreate
      edition: { isbn: generateIsbn13(), claims: { 'wdt:P1476': editionLabel } }
      works: [ { labels: { en: randomLabel() } } ]
    .get 'entries'
    .then (entries)->
      result = entries[0]
      should(result.edition.uri).be.ok()
      { edition } = result

      getByUris edition.uri
      .get 'entities'
      .then (entities)->
        editionClaims = _.values(entities)[0].claims
        newEditionTitle = editionClaims['wdt:P1476'][0]

        should(editionClaims['wdt:P212'][0]).be.ok()
        newEditionTitle.should.equal editionLabel
        done()
    .catch undesiredErr(done)

    return

  it 'should ignore unresolved work from resolve edition', (done)->
    isbn = generateIsbn13()
    ensureEditionExists "isbn:#{isbn}"
    .then (edition)->
      resolveAndCreate
        edition: { isbn }
        works: [ { labels: { en: randomLabel() } } ]
      .then (res)->
        entry = res.entries[0]
        entry.works[0].resolved.should.be.false()
        entry.works[0].created.should.be.false()
        done()
    .catch done

    return

  it 'should add optional claims to created edition', (done)->
    frenchLang = 'wd:Q150'
    resolveAndCreate
      edition: { isbn: generateIsbn13(), claims: { 'wdt:P407': [ frenchLang ] } }
      works: [ { labels: { en: randomLabel() } } ]
    .get 'entries'
    .then (entries)->
      result = entries[0]
      should(result.edition.uri).be.ok()
      { edition } = result
      getByUris edition.uri
      .get 'entities'
      .then (entities)->
        newWorkClaimValue = _.values(entities)[0].claims['wdt:P407'][0]
        newWorkClaimValue.should.equal frenchLang
        done()
    .catch undesiredErr(done)

    return

  it 'should add optional claims to created works', (done)->
    goodReadsId = someGoodReadsId()
    resolveAndCreate
      edition: { isbn: generateIsbn13() }
      works: [ { claims: { 'wdt:P2969': [ goodReadsId ] }, labels: { en: randomLabel() } } ]
    .get 'entries'
    .then (entries)->
      result = entries[0]
      should(result.edition.uri).be.ok()
      { works } = result
      getByUris works.map(_.property('uri'))
      .get 'entities'
      .then (entities)->
        newWorkClaimValue = _.values(entities)[0].claims['wdt:P2969'][0]
        newWorkClaimValue.should.equal goodReadsId
        done()
    .catch undesiredErr(done)

    return

  it 'should add optional claims to created authors', (done)->
    goodReadsId = someGoodReadsId()
    resolveAndCreate
      edition: { isbn: generateIsbn13() }
      works: [ { labels: { en: randomLabel() } } ]
      authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] }, labels: { en: humanName() } } ]
    .get 'entries'
    .then (entries)->
      result = entries[0]
      should(result.edition.uri).be.ok()
      { authors } = result
      getByUris authors.map(_.property('uri'))
      .get 'entities'
      .then (entities)->
        newWorkClaimValue = _.values(entities)[0].claims['wdt:P2963'][0]
        newWorkClaimValue.should.equal goodReadsId
        done()
    .catch undesiredErr(done)

    return

  it 'should add a batch timestamp to patches', (done)->
    startTime = Date.now()
    entry =
      edition: { isbn: generateIsbn13() }
      works: [ { claims: { 'wdt:P2969': [ someGoodReadsId() ] }, labels: { en: humanName() } } ]
    resolveAndCreate entry
    .get 'entries'
    .then (entries)->
      result = entries[0]
      { uri: editionUri } = result.edition
      getHistory editionUri
      .then (patches)->
        patch = patches[0]
        patch.batch.should.be.a.Number()
        patch.batch.should.above startTime
        patch.batch.should.below Date.now()
        done()
    .catch undesiredErr(done)

    return

  it 'should add created authors to created works', (done)->
    resolveAndCreate
      edition: { isbn: generateIsbn13() }
      works: [ { labels: { en: randomLabel() } } ]
      authors: [ { labels: { en: humanName() } } ]
    .get 'entries'
    .then (entries)->
      result = entries[0]
      workUri = result.works[0].uri
      getByUris workUri
      .get 'entities'
      .then (entities)->
        work = entities[workUri]
        workAuthors = work.claims['wdt:P50']
        workAuthors.includes(result.authors[0].uri).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should create a work entity from the edition seed', (done)->
    title = randomLabel()
    title = randomLabel()
    dutchLangUri = 'wd:Q7411'
    dutchLangCode = 'nl'
    resolveAndCreate
      edition:
        isbn: generateIsbn13()
        claims: { 'wdt:P1476': [ title ], 'wdt:P407': [ dutchLangUri ] }
    .get 'entries'
    .then (entries)->
      work = entries[0].works[0]
      work.labels[dutchLangCode].should.equal title
      done()
    .catch undesiredErr(done)

    return

  it 'should not create works without labels', (done)->
    title = randomLabel()
    resolveAndCreate
      edition:
        isbn: generateIsbn13()
        claims: { 'wdt:P1476': [ title ] }
      works: [ {} ]
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.startWith 'invalid labels'
      done()
    .catch done

    return
