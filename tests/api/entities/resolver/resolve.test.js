const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { Promise } = __.require('lib', 'promises')
const { authReq, undesiredRes } = __.require('apiTests', 'utils/utils')
const elasticsearchUpdateDelay = CONFIG.entitiesSearchEngine.elasticsearchUpdateDelay || 1000
const { createWork, createHuman, someGoodReadsId, someOpenLibraryId, createWorkWithAuthor, generateIsbn13 } = __.require('apiTests', 'fixtures/entities')
const { addClaim, getByUri } = __.require('apiTests', 'utils/entities')
const { ensureEditionExists, randomLabel } = __.require('apiTests', 'fixtures/entities')
const { toIsbn13h } = __.require('lib', 'isbn/isbn')

const resolve = entries => {
  entries = _.forceArray(entries)
  return authReq('post', '/api/entities?action=resolve', { entries })
}

describe('entities:resolve', () => {
  it('should throw when invalid isbn is passed', done => {
    const invalidIsbn = '9780000000000'
    resolve({ edition: { isbn: invalidIsbn } })
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid isbn')
      done()
    })
    .catch(done)
  })

  it('should resolve an edition entry from an ISBN', done => {
    const isbn13 = generateIsbn13()
    const editionSeed = { isbn: isbn13 }
    const entry = { edition: editionSeed }
    ensureEditionExists(`isbn:${isbn13}`)
    .then(() => resolve(entry))
    .get('entries')
    .then(entries => {
      entries[0].should.be.an.Object()
      entries[0].edition.uri.should.equal(`isbn:${isbn13}`)
      done()
    })
    .catch(done)
  })

  it('should resolve an edition from a known edition external id', done => {
    const openLibraryId = someOpenLibraryId('edition')
    const isbn13 = generateIsbn13()
    ensureEditionExists(`isbn:${isbn13}`)
    .tap(edition => addClaim(`inv:${edition._id}`, 'wdt:P648', openLibraryId))
    .then(edition => {
      const editionSeed = { claims: { 'wdt:P648': [ openLibraryId ] } }
      const entry = { edition: editionSeed }
      return resolve(entry)
      .get('entries')
      .then(entries => {
        entries[0].edition.uri.should.equal(edition.uri)
        done()
      })
    })
    .catch(done)
  })

  it('should resolve an edition entry from an ISBN set in the claims', done => {
    const isbn13 = generateIsbn13()
    const isbn13h = toIsbn13h(isbn13)
    const editionSeed = { claims: { 'wdt:P212': isbn13h } }
    const entry = { edition: editionSeed }
    ensureEditionExists(`isbn:${isbn13}`)
    .then(() => resolve(entry))
    .get('entries')
    .then(entries => {
      entries[0].should.be.an.Object()
      entries[0].edition.uri.should.equal(`isbn:${isbn13}`)
      done()
    })
    .catch(done)
  })

  it('should resolve multiple entries', done => {
    const isbn13A = generateIsbn13()
    const isbn13B = generateIsbn13()
    const entryA = { edition: { isbn: isbn13A } }
    const entryB = { edition: { isbn: isbn13B } }
    Promise.all([
      ensureEditionExists(`isbn:${isbn13A}`),
      ensureEditionExists(`isbn:${isbn13B}`)
    ])
    .then(() => resolve([ entryA, entryB ]))
    .get('entries')
    .then(entries => {
      entries[0].should.be.an.Object()
      entries[0].edition.uri.should.equal(`isbn:${isbn13A}`)
      entries[1].should.be.an.Object()
      entries[1].edition.uri.should.equal(`isbn:${isbn13B}`)
      done()
    })
    .catch(done)
  })

  it('should reject if key "edition" is missing', done => {
    resolve({})
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('missing edition in entry')
      done()
    })
    .catch(done)
  })

  it('should reject when no isbn is found', done => {
    const entry = {
      edition: [ { claims: { 'wdt:P1476': randomLabel() } } ],
      works: [ { labels: { en: randomLabel() } } ]
    }
    resolve(entry)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('no isbn or external id claims found')
      done()
    })
    .catch(done)
  })

  it('should reject when label lang is invalid', done => {
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { notalang: 'foo' } } ]
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid label lang')
      done()
    })
    .catch(done)
  })

  it('should reject when label value is invalid', done => {
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { fr: [ 'foo' ] } } ]
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid label')
      done()
    })
    .catch(done)
  })

  it('should reject when claims key is not an array of objects', done => {
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { claims: [ 'wdt:P31: wd:Q23' ] } ]
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid claims')
      done()
    })
    .catch(done)
  })

  it('should reject when claims value is invalid', done => {
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [ { claims: { 'wdt:P50': [ 'not a valid entity uri' ] } } ]
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid property value')
      done()
    })
    .catch(done)
  })

  it('should reject when claims key has an unknown property', done => {
    const unknownProp = 'wdt:P6'
    const seed = {
      isbn: generateIsbn13(),
      claims: { [unknownProp]: [ 'wd:Q23' ] }
    }
    resolve({ edition: seed })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("property isn't whitelisted")
      done()
    })
    .catch(done)
  })
})

describe('entities:resolve:external-id', () => {
  it('should resolve wikidata work from external ids claim', done => {
    resolve({
      edition: { isbn: generateIsbn13() },
      works: [ {
        claims: {
          'wdt:P1085': [ '28158' ]
        }
      }
      ]
    })
    .get('entries')
    .then(entries => {
      entries[0].works.should.be.an.Array()
      entries[0].works[0].should.be.an.Object()
      entries[0].works[0].uri.should.equal('wd:Q151883')
      done()
    })
    .catch(done)
  })

  it('should resolve inventaire work from external ids claim', done => {
    const goodReadsId = someGoodReadsId()
    createWork()
    .tap(work => addClaim(work.uri, 'wdt:P2969', goodReadsId))
    .delay(10)
    .then(work => {
      return resolve({
        edition: { isbn: generateIsbn13() },
        works: [ { claims: { 'wdt:P2969': [ goodReadsId ] } } ]
      })
      .get('entries')
      .then(entries => {
        entries[0].works.should.be.an.Array()
        entries[0].works[0].should.be.an.Object()
        entries[0].works[0].uri.should.equal(work.uri)
        done()
      })
    })
    .catch(done)
  })

  it('should resolve wikidata author from external ids claim', done => {
    resolve({
      edition: { isbn: generateIsbn13() },
      authors: [ {
        claims: {
          'wdt:P648': [ 'OL28127A' ]
        }
      }
      ]
    })
    .get('entries')
    .then(entries => {
      entries[0].authors.should.be.an.Array()
      entries[0].authors[0].should.be.an.Object()
      entries[0].authors[0].uri.should.equal('wd:Q16867')
      done()
    })
    .catch(done)
  })

  it('should resolve inventaire author from external ids claim', done => {
    const goodReadsId = someGoodReadsId()
    createHuman()
    .delay(10)
    .tap(author => addClaim(author.uri, 'wdt:P2963', goodReadsId))
    .delay(10)
    .then(author => {
      return resolve({
        edition: { isbn: generateIsbn13() },
        authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
      })
      .get('entries')
      .then(entries => {
        entries[0].authors.should.be.an.Array()
        entries[0].authors[0].should.be.an.Object()
        entries[0].authors[0].uri.should.equal(author.uri)
        done()
      })
    })
    .catch(done)
  })
})

describe('entities:resolve:in-context', () => {
  it('should resolve work from work label and author with external ids claim', done => {
    const goodReadsId = someGoodReadsId()
    const missingWorkLabel = randomLabel()
    const otherWorkLabel = randomLabel()
    createHuman()
    .delay(10)
    .tap(author => addClaim(author.uri, 'wdt:P2963', goodReadsId))
    .delay(10)
    .then(author => {
      return Promise.all([
        createWorkWithAuthor(author, missingWorkLabel),
        createWorkWithAuthor(author, otherWorkLabel)
      ])
      .then(([ work, otherWork ]) => {
        return resolve({
          edition: { isbn: generateIsbn13() },
          works: [ { labels: { en: missingWorkLabel } } ],
          authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
        })
        .get('entries')
        .then(entries => {
          should(entries[0].works[0].uri).be.ok()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should resolve work from author found in work author claims', done => {
    createWorkWithAuthor()
    .then(work => {
      const { labels, claims } = work
      return resolve({
        edition: { isbn: generateIsbn13() },
        works: [ { labels, claims } ]
      })
      .get('entries')
      .then(entries => {
        should(entries[0].works[0].uri).be.ok()
        done()
      })
    })
    .catch(done)
  })

  it('should not resolve work from resolved author when author have several works with same labels', done => {
    const goodReadsId = someGoodReadsId()
    const workLabel = randomLabel()
    createHuman()
    .delay(10)
    .tap(author => addClaim(author.uri, 'wdt:P2963', goodReadsId))
    .delay(10)
    .then(author => {
      return Promise.all([
        createWorkWithAuthor(author, workLabel),
        createWorkWithAuthor(author, workLabel)
      ])
      .then(([ work, otherWork ]) => {
        const entry = {
          edition: { isbn: generateIsbn13() },
          works: [ { labels: { en: workLabel } } ],
          authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] } } ]
        }
        return resolve(entry)
        .get('entries')
        .then(entries => {
          should(entries[0].works[0].uri).not.be.ok()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should resolve author from inv author with same label, and an inv work with external id', done => {
    const goodReadsId = someGoodReadsId()
    const workLabel = randomLabel()
    createHuman()
    .delay(10)
    .then(author => {
      return createWorkWithAuthor(author, workLabel)
      .tap(work => addClaim(work.uri, 'wdt:P2969', goodReadsId))
      .then(work => {
        const entry = {
          edition: { isbn: generateIsbn13() },
          works: [ { claims: { 'wdt:P2969': [ goodReadsId ] } } ],
          authors: [ { labels: author.labels } ]
        }
        return resolve(entry)
        .get('entries')
        .then(entries => {
          should(entries[0].works[0].uri).be.ok()
          should(entries[0].authors[0].uri).be.ok()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should resolve work from resolve edition', done => {
    const isbn = generateIsbn13()
    ensureEditionExists(`isbn:${isbn}`)
    .then(edition => {
      return getByUri(edition.claims['wdt:P629'][0])
      .then(work => {
        const { labels } = work
        return resolve({
          edition: { isbn },
          works: [ { labels } ]
        })
        .then(res => {
          res.entries[0].works[0].uri.should.equal(work.uri)
          done()
        })
      })
    })
    .catch(done)
  })

  it('should ignore unresolved work from resolve edition', done => {
    const isbn = generateIsbn13()
    ensureEditionExists(`isbn:${isbn}`)
    .then(edition => {
      return resolve({
        edition: { isbn },
        works: [ { labels: { en: randomLabel() } } ]
      })
      .then(res => {
        const entry = res.entries[0]
        entry.works[0].resolved.should.be.false()
        done()
      })
    })
    .catch(done)
  })
})

describe('entities:resolve:on-labels', () => {
  it('should not resolve work pair if no labels match', done => {
    createHuman()
    .then(author => {
      const workLabel = randomLabel()
      const seedLabel = randomLabel()
      const authorLabel = author.labels.en
      return createWorkWithAuthor(author, workLabel)
      .delay(elasticsearchUpdateDelay)
      .then(work => {
        return resolve(basicEntry(seedLabel, authorLabel))
        .get('entries')
        .then(entries => {
          should(entries[0].works[0].uri).not.be.ok()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should resolve author and work pair by searching for exact labels', done => {
    createHuman()
    .then(author => {
      const workLabel = randomLabel()
      const authorLabel = author.labels.en
      return createWorkWithAuthor(author, workLabel)
      .delay(elasticsearchUpdateDelay)
      .then(work => {
        return resolve(basicEntry(workLabel, authorLabel))
        .get('entries')
        .then(entries => {
          entries[0].works[0].uri.should.equal(work.uri)
          entries[0].authors[0].uri.should.equal(author.uri)
          done()
        })
      })
    })
    .catch(done)
  })

  it('should resolve work pair with case insentive labels', done => {
    createHuman()
    .then(author => {
      const workLabel = randomLabel()
      const seedLabel = workLabel.toUpperCase()
      const authorLabel = author.labels.en
      return createWorkWithAuthor(author, workLabel)
      .delay(elasticsearchUpdateDelay)
      .then(work => {
        return resolve(basicEntry(seedLabel, authorLabel))
        .get('entries')
        .then(entries => {
          entries[0].works[0].uri.should.equal(work.uri)
          entries[0].authors[0].uri.should.equal(author.uri)
          done()
        })
      })
    })
    .catch(done)
  })

  it('should not resolve when several works exist', done => {
    createHuman()
    .then(author => {
      return createHuman({ labels: author.labels })
      .then(sameLabelAuthor => {
        const workLabel = randomLabel()
        return Promise.all([
          createWorkWithAuthor(author, workLabel),
          createWorkWithAuthor(sameLabelAuthor, workLabel)
        ])
        .delay(elasticsearchUpdateDelay)
        .then(works => {
          return resolve(basicEntry(workLabel, author.labels.en))
          .get('entries')
          .then(entries => {
            should(entries[0].works[0].uri).not.be.ok()
            should(entries[0].authors[0].uri).not.be.ok()
            done()
          })
        })
      })
    })
    .catch(done)
  })
})

const basicEntry = (workLabel, authorLabel) => ({
  edition: { isbn: generateIsbn13() },
  works: [ { labels: { en: workLabel } } ],
  authors: [ { labels: { en: authorLabel } } ]
})
