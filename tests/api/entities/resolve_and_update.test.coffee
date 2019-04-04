CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, undesiredErr, undesiredRes } = require '../utils/utils'
{ getByUris, addClaim, getHistory } = require '../utils/entities'
{ createWork, createHuman, ensureEditionExists, someGoodReadsId, randomLabel, generateIsbn13 } = require '../fixtures/entities'
resolveAndUpdate = (entries)->
  entries = _.forceArray entries
  authReq 'post', '/api/entities?action=resolve',
    entries: entries
    update: true

describe 'entities:resolver:update-resolved', ->
  it 'should update works claim values if property does not exist', (done)->
    entryA = someEntryWithAGoodReadsWorkId()
    entryB = someEntryWithAGoodReadsWorkId()
    goodReadsIdA = entryA.works[0].claims['wdt:P2969'][0]
    goodReadsIdB = entryB.works[0].claims['wdt:P2969'][0]
    Promise.all [
      createWork().tap (work)-> addClaim work.uri, 'wdt:P2969', goodReadsIdA
      createWork().tap (work)-> addClaim work.uri, 'wdt:P2969', goodReadsIdB
    ]
    .spread (workA, workB)->
      resolveAndUpdate [ entryA, entryB ]
      .get 'results'
      .then (results)->
        workAUri = results[0].works[0].uri
        workBUri = results[1].works[0].uri
        getByUris [ workAUri, workBUri ]
        .get 'entities'
        .then (entities)->
          workA = entities[workAUri]
          workB = entities[workBUri]
          workA.claims['wdt:P50'][0].should.equal entryA.works[0].claims['wdt:P50'][0]
          workB.claims['wdt:P50'][0].should.equal entryB.works[0].claims['wdt:P50'][0]
          done()
    .catch done

    return

  it 'should not update works claim values if property exists', (done)->
    goodReadsId = someGoodReadsId()
    authorUri = 'wd:Q35802'
    authorUri2 = 'wd:Q184226'
    entry =
      edition: [ { isbn: generateIsbn13() } ]
      works: [
        claims:
          'wdt:P2969': [ goodReadsId ],
          'wdt:P50': [ authorUri ]
      ]
    createWork()
    .tap (work)-> addClaim work.uri, 'wdt:P2969', goodReadsId
    .tap (work)-> addClaim work.uri, 'wdt:P50', authorUri2
    .then (work)->
      resolveAndUpdate entry
      .get 'results'
      .then (results)->
        entityUri = results[0].works[0].uri
        getByUris(entityUri)
        .get 'entities'
        .then (entities)->
          authorClaimValues = _.values(entities)[0].claims['wdt:P50']
          authorClaimValues.should.not.containEql authorUri
          done()
    .catch done

    return

  it 'should update authors claim values', (done)->
    goodReadsId = someGoodReadsId()
    officialWebsite = 'http://Q35802.org'
    entry =
      edition: [ { isbn: generateIsbn13() } ]
      authors: [
        claims:
          'wdt:P2963': [ goodReadsId ],
          'wdt:P856': [ officialWebsite ]
      ]
    createHuman()
    .tap (human)-> addClaim human.uri, 'wdt:P2963', goodReadsId
    .then (human)->
      resolveAndUpdate entry
      .get 'results'
      .then (results)->
        authorUri = results[0].authors[0].uri
        authorUri.should.equal human.uri
        getByUris authorUri
        .get 'entities'
        .then (entities)->
          updatedAuthor = entities[authorUri]
          authorWebsiteClaimValues = updatedAuthor.claims['wdt:P856']
          authorWebsiteClaimValues.should.containEql officialWebsite
          done()
    .catch done

    return

  it 'should update edition claims', (done)->
    numberOfPages = 3
    isbn = generateIsbn13()
    editionUri = "isbn:#{isbn}"
    title = randomLabel()

    ensureEditionExists editionUri, null,
      labels: {}
      claims:
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P1476': [ title ]
    .then (edition)->
      entry =
        edition: [
          isbn: isbn
          claims: { 'wdt:P1104': numberOfPages }
        ]
      resolveAndUpdate entry
      .get 'results'
      .delay 10
      .then (results)->
        getByUris editionUri
        .get 'entities'
        .then (entities)->
          edition = entities[editionUri]
          numberOfPagesClaimsValues = edition.claims['wdt:P1104']
          numberOfPagesClaimsValues.should.containEql numberOfPages
          done()
    .catch done

    return

  it 'should add a batch timestamp to patches', (done)->
    startTime = Date.now()
    entryA = someEntryWithAGoodReadsWorkId()
    entryB = someEntryWithAGoodReadsWorkId()
    goodReadsIdA = entryA.works[0].claims['wdt:P2969'][0]
    goodReadsIdB = entryB.works[0].claims['wdt:P2969'][0]
    Promise.all [
      createWork().tap (work)-> addClaim work.uri, 'wdt:P2969', goodReadsIdA
      createWork().tap (work)-> addClaim work.uri, 'wdt:P2969', goodReadsIdB
    ]
    .spread (workA, workB)->
      resolveAndUpdate [ entryA, entryB ]
      .then ->
        Promise.all [
          getHistory workA.uri
          getHistory workB.uri
        ]
        .spread (workAPatches, workBPatches)->
          lastWorkAPatch = workAPatches.slice(-1)[0]
          lastWorkBPatch = workBPatches.slice(-1)[0]
          lastWorkBPatch.batch.should.equal lastWorkAPatch.batch
          { batch: batchId } = lastWorkAPatch
          batchId.should.be.a.Number()
          batchId.should.above startTime
          batchId.should.below Date.now()
          done()
    .catch undesiredErr(done)

    return

someEntryWithAGoodReadsWorkId = ->
  edition: [ { isbn: generateIsbn13() } ]
  works: [
    claims:
      'wdt:P2969': [ someGoodReadsId() ],
      'wdt:P50': [ 'wd:Q35802' ]
  ]
