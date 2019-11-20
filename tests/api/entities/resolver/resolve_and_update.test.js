
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { Promise } = __.require('lib', 'promises')
const { authReq, undesiredErr } = __.require('apiTests', 'utils/utils')
const { getByUris, addClaim, getHistory } = __.require('apiTests', 'utils/entities')
const { createWork, createHuman, ensureEditionExists, someGoodReadsId, randomLabel, generateIsbn13 } = __.require('apiTests', 'fixtures/entities')
const resolveAndUpdate = entries => {
  entries = _.forceArray(entries)
  return authReq('post', '/api/entities?action=resolve', {
    entries,
    update: true
  })
}

describe('entities:resolver:update-resolved', () => {
  it('should not update entity claim values if property exists', done => {
    const goodReadsId = someGoodReadsId()
    const authorUri = 'wd:Q35802'
    const authorUri2 = 'wd:Q184226'
    const entry = {
      edition: { isbn: generateIsbn13() },
      works: [ {
        claims: {
          'wdt:P2969': [ goodReadsId ],
          'wdt:P50': [ authorUri ]
        }
      }
      ]
    }
    createWork()
    .tap(work => addClaim(work.uri, 'wdt:P2969', goodReadsId))
    .tap(work => addClaim(work.uri, 'wdt:P50', authorUri2))
    .then(work => resolveAndUpdate(entry)
    .get('entries')
    .then(entries => {
      const entityUri = entries[0].works[0].uri
      return getByUris(entityUri)
      .get('entities')
      .then(entities => {
        const workAuthorsUris = _.values(entities)[0].claims['wdt:P50']
        workAuthorsUris.should.not.containEql(authorUri)
        done()
      })
    }))
    .catch(done)
  })

  it('should update entities claims values if property does not exist', done => {
    const entryA = someEntryWithAGoodReadsWorkId()
    const entryB = someEntryWithAGoodReadsWorkId()
    const goodReadsIdA = entryA.works[0].claims['wdt:P2969'][0]
    const goodReadsIdB = entryB.works[0].claims['wdt:P2969'][0]
    Promise.all([
      createWork().tap(work => addClaim(work.uri, 'wdt:P2969', goodReadsIdA)),
      createWork().tap(work => addClaim(work.uri, 'wdt:P2969', goodReadsIdB))
    ])
    .spread((workA, workB) => resolveAndUpdate([ entryA, entryB ])
    .get('entries')
    .then(entries => {
      const workAUri = entries[0].works[0].uri
      const workBUri = entries[1].works[0].uri
      return getByUris([ workAUri, workBUri ])
      .get('entities')
      .then(entities => {
        workA = entities[workAUri]
        workB = entities[workBUri]
        workA.claims['wdt:P50'][0].should.equal(entryA.works[0].claims['wdt:P50'][0])
        workB.claims['wdt:P50'][0].should.equal(entryB.works[0].claims['wdt:P50'][0])
        done()
      })
    }))
    .catch(done)
  })

  it('should update authors claims', done => {
    const goodReadsId = someGoodReadsId()
    const officialWebsite = 'http://Q35802.org'
    const entry = {
      edition: { isbn: generateIsbn13() },
      authors: [ {
        claims: {
          'wdt:P2963': [ goodReadsId ],
          'wdt:P856': [ officialWebsite ]
        }
      }
      ]
    }
    createHuman()
    .tap(human => addClaim(human.uri, 'wdt:P2963', goodReadsId))
    .then(human => resolveAndUpdate(entry)
    .get('entries')
    .then(entries => {
      const authorUri = entries[0].authors[0].uri
      authorUri.should.equal(human.uri)
      return getByUris(authorUri)
      .get('entities')
      .then(entities => {
        const updatedAuthor = entities[authorUri]
        const authorWebsiteClaimValues = updatedAuthor.claims['wdt:P856']
        authorWebsiteClaimValues.should.containEql(officialWebsite)
        done()
      })
    }))
    .catch(done)
  })

  it('should update edition claims', done => {
    const numberOfPages = 3
    const isbn = generateIsbn13()
    const editionUri = `isbn:${isbn}`
    const title = randomLabel()

    ensureEditionExists(editionUri, null, {
      labels: {},
      claims: {
        'wdt:P31': [ 'wd:Q3331189' ],
        'wdt:P1476': [ title ]
      }
    })
    .then(edition => {
      const entry = {
        edition: {
          isbn,
          claims: { 'wdt:P1104': numberOfPages }
        }
      }
      return resolveAndUpdate(entry)
      .get('entries')
      .delay(10)
      .then(entries => getByUris(editionUri)
      .get('entities')
      .then(entities => {
        edition = entities[editionUri]
        const numberOfPagesClaimsValues = edition.claims['wdt:P1104']
        numberOfPagesClaimsValues.should.containEql(numberOfPages)
        done()
      }))
    })
    .catch(done)
  })

  it('should add a batch timestamp to patches', done => {
    const startTime = Date.now()
    const entryA = someEntryWithAGoodReadsWorkId()
    const entryB = someEntryWithAGoodReadsWorkId()
    const goodReadsIdA = entryA.works[0].claims['wdt:P2969'][0]
    const goodReadsIdB = entryB.works[0].claims['wdt:P2969'][0]
    Promise.all([
      createWork().tap(work => addClaim(work.uri, 'wdt:P2969', goodReadsIdA)),
      createWork().tap(work => addClaim(work.uri, 'wdt:P2969', goodReadsIdB))
    ])
    .spread((workA, workB) => resolveAndUpdate([ entryA, entryB ])
    .then(() => Promise.all([
      getHistory(workA.uri),
      getHistory(workB.uri)
    ])
    .spread((workAPatches, workBPatches) => {
      const lastWorkAPatch = workAPatches.slice(-1)[0]
      const lastWorkBPatch = workBPatches.slice(-1)[0]
      lastWorkBPatch.batch.should.equal(lastWorkAPatch.batch)
      const { batch: batchId } = lastWorkAPatch
      batchId.should.be.a.Number()
      batchId.should.above(startTime)
      batchId.should.below(Date.now())
      done()
    })))
    .catch(undesiredErr(done))
  })
})

const someEntryWithAGoodReadsWorkId = () => ({
  edition: { isbn: generateIsbn13() },

  works: [ {
    claims: {
      'wdt:P2969': [ someGoodReadsId() ],
      'wdt:P50': [ 'wd:Q35802' ]
    }
  }
  ]
})
