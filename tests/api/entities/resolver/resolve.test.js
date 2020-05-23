const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { wait } = __.require('lib', 'promises')
const { authReq, shouldNotBeCalled } = __.require('apiTests', 'utils/utils')
const elasticsearchUpdateDelay = CONFIG.entitiesSearchEngine.elasticsearchUpdateDelay || 1000
const { createWork, createHuman, someGoodReadsId, someLibraryThingsWorkId, someOpenLibraryId, createWorkWithAuthor, generateIsbn13 } = __.require('apiTests', 'fixtures/entities')
const { addClaim, getByUri } = __.require('apiTests', 'utils/entities')
const { ensureEditionExists, randomLabel } = __.require('apiTests', 'fixtures/entities')
const { toIsbn13h } = __.require('lib', 'isbn/isbn')

const resolve = entries => {
  entries = _.forceArray(entries)
  return authReq('post', '/api/entities?action=resolve', { entries })
}

describe('entities:resolve', () => {
  it('should throw when invalid isbn is passed', async () => {
    const invalidIsbn = '9780000000000'
    try {
      await resolve({ edition: { isbn: invalidIsbn } }).then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid isbn')
    }
  })

  it('should resolve an edition entry from an ISBN', async () => {
    const isbn13 = generateIsbn13()
    const editionSeed = { isbn: isbn13 }
    const entry = { edition: editionSeed }
    await ensureEditionExists(`isbn:${isbn13}`)
    const { entries } = await resolve(entry)
    entries[0].should.be.an.Object()
    entries[0].edition.uri.should.equal(`isbn:${isbn13}`)
  })

  it('should resolve an edition from a known edition external id', async () => {
    const openLibraryId = someOpenLibraryId('edition')
    const isbn13 = generateIsbn13()
    const edition = await ensureEditionExists(`isbn:${isbn13}`)
    await addClaim(`inv:${edition._id}`, 'wdt:P648', openLibraryId)
    const editionSeed = { claims: { 'wdt:P648': [ openLibraryId ] } }
    const entry = { edition: editionSeed }
    const { entries } = await resolve(entry)
    entries[0].edition.uri.should.equal(edition.uri)
  })

  it('should resolve an edition entry from an ISBN set in the claims', async () => {
    const isbn13 = generateIsbn13()
    const isbn13h = toIsbn13h(isbn13)
    const editionSeed = { claims: { 'wdt:P212': isbn13h } }
    const entry = { edition: editionSeed }
    await ensureEditionExists(`isbn:${isbn13}`)
    const { entries } = await resolve(entry)
    entries[0].should.be.an.Object()
    entries[0].edition.uri.should.equal(`isbn:${isbn13}`)
  })

  it('should resolve multiple entries', async () => {
    const isbn13A = generateIsbn13()
    const isbn13B = generateIsbn13()
    const entryA = { edition: { isbn: isbn13A } }
    const entryB = { edition: { isbn: isbn13B } }
    await Promise.all([
      ensureEditionExists(`isbn:${isbn13A}`),
      ensureEditionExists(`isbn:${isbn13B}`)
    ])
    const { entries } = await resolve([ entryA, entryB ])
    entries[0].should.be.an.Object()
    entries[0].edition.uri.should.equal(`isbn:${isbn13A}`)
    entries[1].should.be.an.Object()
    entries[1].edition.uri.should.equal(`isbn:${isbn13B}`)
  })

  it('should reject if key "edition" is missing', async () => {
    try {
      await resolve({}).then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('missing edition in entry')
    }
  })

  it('should reject when no isbn is found', async () => {
    const entry = {
      edition: [ { claims: { 'wdt:P1476': randomLabel() } } ],
      works: [ { labels: { en: randomLabel() } } ]
    }
    try {
      await resolve(entry).then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('no isbn or external id claims found')
    }
  })

  it('should reject when label lang is invalid', async () => {
    try {
      await resolve({
        edition: { isbn: generateIsbn13() },
        works: [ { labels: { notalang: 'foo' } } ]
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid label lang')
    }
  })

  it('should reject when label value is invalid', async () => {
    try {
      await resolve({
        edition: { isbn: generateIsbn13() },
        works: [ { labels: { fr: [ 'foo' ] } } ]
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid label')
    }
  })

  it('should reject when claims key is not an array of objects', async () => {
    try {
      await resolve({
        edition: { isbn: generateIsbn13() },
        works: [ { claims: [ 'wdt:P31: wd:Q23' ] } ]
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid claims')
    }
  })

  it('should reject when claims value is invalid', async () => {
    try {
      await resolve({
        edition: { isbn: generateIsbn13() },
        works: [ { claims: { 'wdt:P50': [ 'not a valid entity uri' ] } } ]
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid property value')
    }
  })

  it('should reject when claims key has an unknown property', async () => {
    const unknownProp = 'wdt:P6'
    const seed = {
      isbn: generateIsbn13(),
      claims: { [unknownProp]: [ 'wd:Q23' ] }
    }
    try {
      await resolve({ edition: seed }).then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("property isn't whitelisted")
    }
  })
})

describe('entities:resolve:external-id', () => {
  it('should resolve wikidata work from external ids claim', async () => {
    const { entries } = await resolve({
      edition: { isbn: generateIsbn13() },
      works: [ {
        claims: {
          'wdt:P1085': [ '28158' ]
        }
      }
      ]
    })
    entries[0].works.should.be.an.Array()
    entries[0].works[0].should.be.an.Object()
    entries[0].works[0].uri.should.equal('wd:Q151883')
  })

  it('should resolve inventaire work from external ids claim', async () => {
    const libraryThingsWorkId = someLibraryThingsWorkId()
    const work = await createWork()
    await addClaim(work.uri, 'wdt:P1085', libraryThingsWorkId)
    await wait(10)
    const { entries } = await resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { claims: { 'wdt:P1085': [ libraryThingsWorkId ] } } ]
    })
    entries[0].works.should.be.an.Array()
    entries[0].works[0].should.be.an.Object()
    entries[0].works[0].uri.should.equal(work.uri)
  })

  it('should resolve wikidata author from external ids claim', async () => {
    const author = {
      claims: {
        'wdt:P648': [ 'OL28127A' ]
      }
    }
    const { entries } = await resolve({
      edition: { isbn: generateIsbn13() },
      authors: [ author ]
    })
    entries[0].authors.should.be.an.Array()
    entries[0].authors[0].should.be.an.Object()
    entries[0].authors[0].uri.should.equal('wd:Q16867')
  })

  it('should resolve inventaire author from external ids claim', async () => {
    const goodReadsId = someGoodReadsId()
    const author = await createHuman()
    await wait(10)
    await addClaim(author.uri, 'wdt:P2963', goodReadsId)
    await wait(10)
    const { entries } = await resolve({
      edition: { isbn: generateIsbn13() },
      authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
    })
    entries[0].authors.should.be.an.Array()
    entries[0].authors[0].should.be.an.Object()
    entries[0].authors[0].uri.should.equal(author.uri)
  })
})

describe('entities:resolve:in-context', () => {
  it('should resolve work from work label and author with external ids claim', async () => {
    const goodReadsId = someGoodReadsId()
    const missingWorkLabel = randomLabel()
    const otherWorkLabel = randomLabel()
    const author = await createHuman()
    await wait(10)
    await addClaim(author.uri, 'wdt:P2963', goodReadsId)
    await wait(10)
    await Promise.all([
      createWorkWithAuthor(author, missingWorkLabel),
      createWorkWithAuthor(author, otherWorkLabel)
    ])
    const { entries } = await resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { en: missingWorkLabel } } ],
      authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
    })
    should(entries[0].works[0].uri).be.ok()
  })

  it('should resolve work from author found in work author claims', async () => {
    const work = await createWorkWithAuthor()
    const { labels, claims } = work
    const { entries } = await resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { labels, claims } ]
    })
    should(entries[0].works[0].uri).be.ok()
  })

  it('should not resolve work from resolved author when author have several works with same labels', async () => {
    const goodReadsId = someGoodReadsId()
    const workLabel = randomLabel()
    const author = await createHuman()
    await wait(10)
    await addClaim(author.uri, 'wdt:P2963', goodReadsId)
    await wait(10)
    await Promise.all([
      createWorkWithAuthor(author, workLabel),
      createWorkWithAuthor(author, workLabel)
    ])
    const entry = {
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { en: workLabel } } ],
      authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
    }
    const { entries } = await resolve(entry)
    should(entries[0].works[0].uri).not.be.ok()
  })

  it('should resolve author from inv author with same label, and an inv work with external id', async () => {
    const libraryThingsWorkId = someLibraryThingsWorkId()
    const workLabel = randomLabel()
    const author = await createHuman()
    await wait(10)
    const work = await createWorkWithAuthor(author, workLabel)
    await addClaim(work.uri, 'wdt:P1085', libraryThingsWorkId)
    const entry = {
      edition: { isbn: generateIsbn13() },
      works: [ { claims: { 'wdt:P1085': [ libraryThingsWorkId ] } } ],
      authors: [ { labels: author.labels } ]
    }
    const { entries } = await resolve(entry)
    should(entries[0].works[0].uri).be.ok()
    should(entries[0].authors[0].uri).be.ok()
  })

  it('should resolve work from resolve edition', async () => {
    const isbn = generateIsbn13()
    const edition = await ensureEditionExists(`isbn:${isbn}`)
    const work = await getByUri(edition.claims['wdt:P629'][0])
    const { labels } = work
    const { entries } = await resolve({
      edition: { isbn },
      works: [ { labels } ]
    })
    entries[0].works[0].uri.should.equal(work.uri)
  })

  it('should ignore unresolved work from resolve edition', async () => {
    const isbn = generateIsbn13()
    await ensureEditionExists(`isbn:${isbn}`)
    const { entries } = await resolve({
      edition: { isbn },
      works: [ { labels: { en: randomLabel() } } ]
    })
    const entry = entries[0]
    entry.works[0].resolved.should.be.false()
  })
})

describe('entities:resolve:on-labels', () => {
  it('should not resolve work pair if no labels match', async () => {
    const author = await createHuman()
    const workLabel = randomLabel()
    const seedLabel = randomLabel()
    const authorLabel = author.labels.en
    await createWorkWithAuthor(author, workLabel)
    await wait(elasticsearchUpdateDelay)
    const { entries } = await resolve(basicEntry(seedLabel, authorLabel))
    should(entries[0].works[0].uri).not.be.ok()
  })

  it('should resolve author and work pair by searching for exact labels', async () => {
    const author = await createHuman()
    const workLabel = randomLabel()
    const authorLabel = author.labels.en
    const work = await createWorkWithAuthor(author, workLabel)
    await wait(elasticsearchUpdateDelay)
    const { entries } = await resolve(basicEntry(workLabel, authorLabel))
    entries[0].works[0].uri.should.equal(work.uri)
    entries[0].authors[0].uri.should.equal(author.uri)
  })

  it('should resolve work pair with case insentive labels', async () => {
    const author = await createHuman()
    const workLabel = randomLabel()
    const seedLabel = workLabel.toUpperCase()
    const authorLabel = author.labels.en
    const work = await createWorkWithAuthor(author, workLabel)
    await wait(elasticsearchUpdateDelay)
    const { entries } = await resolve(basicEntry(seedLabel, authorLabel))
    entries[0].works[0].uri.should.equal(work.uri)
    entries[0].authors[0].uri.should.equal(author.uri)
  })

  it('should not resolve when several works exist', async () => {
    const author = await createHuman()
    const sameLabelAuthor = await createHuman({ labels: author.labels })
    const workLabel = randomLabel()
    await Promise.all([
      createWorkWithAuthor(author, workLabel),
      createWorkWithAuthor(sameLabelAuthor, workLabel)
    ])
    await wait(elasticsearchUpdateDelay)
    const { entries } = await resolve(basicEntry(workLabel, author.labels.en))
    should(entries[0].works[0].uri).not.be.ok()
    should(entries[0].authors[0].uri).not.be.ok()
  })
})

const basicEntry = (workLabel, authorLabel) => ({
  edition: { isbn: generateIsbn13() },
  works: [ { labels: { en: workLabel } } ],
  authors: [ { labels: { en: authorLabel } } ]
})
