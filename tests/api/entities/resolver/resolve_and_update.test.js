const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { wait, tap } = __.require('lib', 'promises')
const { authReq } = __.require('apiTests', 'utils/utils')
const { getByUris, addClaim, getHistory } = __.require('apiTests', 'utils/entities')
const { createWork, createHuman, createEditionWithIsbn, someGoodReadsId, someLibraryThingsWorkId, generateIsbn13 } = __.require('apiTests', 'fixtures/entities')
const resolveAndUpdate = entries => {
  entries = _.forceArray(entries)
  return authReq('post', '/api/entities?action=resolve', {
    entries,
    update: true
  })
}

describe('entities:resolver:update-resolved', () => {
  it('should not update entity claim values if claim exists', done => {
    const libraryThingsWorkId = someLibraryThingsWorkId()
    const authorUri = 'wd:Q35802'
    const authorUri2 = 'wd:Q184226'
    const entry = {
      edition: { isbn: generateIsbn13() },
      works: [ {
        claims: {
          'wdt:P1085': [ libraryThingsWorkId ],
          'wdt:P50': [ authorUri ]
        }
      }
      ]
    }
    createWork()
    .then(tap(work => addClaim(work.uri, 'wdt:P1085', libraryThingsWorkId)))
    .then(tap(work => addClaim(work.uri, 'wdt:P50', authorUri2)))
    .then(work => {
      return resolveAndUpdate(entry)
      .then(({ entries }) => entries)
      .then(entries => {
        const entityUri = entries[0].works[0].uri
        return getByUris(entityUri)
        .then(({ entities }) => entities)
        .then(entities => {
          const workAuthorsUris = _.values(entities)[0].claims['wdt:P50']
          workAuthorsUris.should.containEql(authorUri2)
          workAuthorsUris.should.not.containEql(authorUri)
          done()
        })
      })
    })
    .catch(done)
  })

  it('should update entities claims values if claim does not exist', done => {
    const entryA = someEntryWithAGoodReadsWorkId()
    const entryB = someEntryWithAGoodReadsWorkId()
    const libraryThingsWorkIdA = entryA.works[0].claims['wdt:P1085'][0]
    const libraryThingsWorkIdB = entryB.works[0].claims['wdt:P1085'][0]
    Promise.all([
      createWork().then(tap(work => addClaim(work.uri, 'wdt:P1085', libraryThingsWorkIdA))),
      createWork().then(tap(work => addClaim(work.uri, 'wdt:P1085', libraryThingsWorkIdB)))
    ])
    .then(([ workA, workB ]) => {
      return resolveAndUpdate([ entryA, entryB ])
      .then(({ entries }) => entries)
      .then(entries => {
        const workAUri = entries[0].works[0].uri
        const workBUri = entries[1].works[0].uri
        return getByUris([ workAUri, workBUri ])
        .then(({ entities }) => entities)
        .then(entities => {
          workA = entities[workAUri]
          workB = entities[workBUri]
          workA.claims['wdt:P50'][0].should.equal(entryA.works[0].claims['wdt:P50'][0])
          workB.claims['wdt:P50'][0].should.equal(entryB.works[0].claims['wdt:P50'][0])
          done()
        })
      })
    })
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
    .then(tap(human => addClaim(human.uri, 'wdt:P2963', goodReadsId)))
    .then(human => {
      return resolveAndUpdate(entry)
      .then(({ entries }) => entries)
      .then(entries => {
        const authorUri = entries[0].authors[0].uri
        authorUri.should.equal(human.uri)
        return getByUris(authorUri)
        .then(({ entities }) => entities)
        .then(entities => {
          const updatedAuthor = entities[authorUri]
          const authorWebsiteClaimValues = updatedAuthor.claims['wdt:P856']
          authorWebsiteClaimValues.should.containEql(officialWebsite)
          done()
        })
      })
    })
    .catch(done)
  })

  it('should update edition claims', async () => {
    const numberOfPages = 3
    const { uri, isbn } = await createEditionWithIsbn()
    const entry = {
      edition: {
        isbn,
        claims: { 'wdt:P1104': numberOfPages }
      }
    }
    await resolveAndUpdate(entry)
    await wait(10)
    const { entities } = await getByUris(uri)
    const updatedEdition = entities[uri]
    const numberOfPagesClaimsValues = updatedEdition.claims['wdt:P1104']
    numberOfPagesClaimsValues.should.containEql(numberOfPages)
  })

  it('should add a batch timestamp to patches', done => {
    const startTime = Date.now()
    const entryA = someEntryWithAGoodReadsWorkId()
    const entryB = someEntryWithAGoodReadsWorkId()
    const libraryThingsWorkIdA = entryA.works[0].claims['wdt:P1085'][0]
    const libraryThingsWorkIdB = entryB.works[0].claims['wdt:P1085'][0]
    Promise.all([
      createWork().then(tap(work => addClaim(work.uri, 'wdt:P1085', libraryThingsWorkIdA))),
      createWork().then(tap(work => addClaim(work.uri, 'wdt:P1085', libraryThingsWorkIdB)))
    ])
    .then(([ workA, workB ]) => {
      return resolveAndUpdate([ entryA, entryB ])
      .then(() => {
        return Promise.all([
          getHistory(workA.uri),
          getHistory(workB.uri)
        ])
        .then(([ workAPatches, workBPatches ]) => {
          const lastWorkAPatch = workAPatches.slice(-1)[0]
          const lastWorkBPatch = workBPatches.slice(-1)[0]
          lastWorkBPatch.batch.should.equal(lastWorkAPatch.batch)
          const { batch: batchId } = lastWorkAPatch
          batchId.should.be.a.Number()
          batchId.should.above(startTime)
          batchId.should.below(Date.now())
          done()
        })
      })
    })
    .catch(done)
  })
})

const someEntryWithAGoodReadsWorkId = () => ({
  edition: { isbn: generateIsbn13() },

  works: [ {
    claims: {
      'wdt:P1085': [ someLibraryThingsWorkId() ],
      'wdt:P50': [ 'wd:Q35802' ]
    }
  }
  ]
})
