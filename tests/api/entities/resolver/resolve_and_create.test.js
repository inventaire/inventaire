const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { authReq, undesiredRes } = __.require('apiTests', 'utils/utils')
const { getByUris, getHistory } = __.require('apiTests', 'utils/entities')
const { randomLabel, humanName, generateIsbn13, someGoodReadsId, ensureEditionExists } = __.require('apiTests', 'fixtures/entities')

const resolveAndCreate = entry => authReq('post', '/api/entities?action=resolve', {
  entries: [ entry ],
  create: true
})

describe('entities:resolve:create-unresolved', () => {
  it('should create unresolved edition, work and author (the trinity)', done => {
    resolveAndCreate({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { en: randomLabel() } } ],
      authors: [ { labels: { en: humanName() } } ]
    })
    .then(({ entries }) => entries)
    .then(entries => {
      const result = entries[0]
      result.edition.created.should.be.true()
      result.authors[0].created.should.be.true()
      result.works[0].created.should.be.true()
      should(result.edition.uri).be.ok()
      should(result.works[0].uri).be.ok()
      should(result.authors[0].uri).be.ok()
      done()
    })
    .catch(done)
  })

  it('should resolve and not create an existing edition', done => {
    const rawIsbn = generateIsbn13()
    ensureEditionExists(`isbn:${rawIsbn}`)
    .then(() => resolveAndCreate({ edition: { isbn: rawIsbn } }))
    .then(({ entries }) => entries)
    .then(entries => {
      entries[0].should.be.an.Object()
      entries[0].edition.uri.should.equal(`isbn:${rawIsbn}`)
      done()
    })
    .catch(done)
  })

  it('should create edition with title and isbn', done => {
    const editionLabel = randomLabel()
    resolveAndCreate({
      edition: { isbn: generateIsbn13(), claims: { 'wdt:P1476': editionLabel } },
      works: [ { labels: { en: randomLabel() } } ]
    })
    .then(({ entries }) => entries)
    .then(entries => {
      const result = entries[0]
      should(result.edition.uri).be.ok()
      const { edition } = result

      return getByUris(edition.uri)
      .then(({ entities }) => entities)
      .then(entities => {
        const editionClaims = _.values(entities)[0].claims
        const newEditionTitle = editionClaims['wdt:P1476'][0]

        should(editionClaims['wdt:P212'][0]).be.ok()
        newEditionTitle.should.equal(editionLabel)
        done()
      })
    })
    .catch(done)
  })

  it('should ignore unresolved work from resolve edition', done => {
    const isbn = generateIsbn13()
    ensureEditionExists(`isbn:${isbn}`)
    .then(edition => {
      return resolveAndCreate({
        edition: { isbn },
        works: [ { labels: { en: randomLabel() } } ]
      })
      .then(res => {
        const entry = res.entries[0]
        entry.works[0].resolved.should.be.false()
        entry.works[0].created.should.be.false()
        done()
      })
    })
    .catch(done)
  })

  it('should add optional claims to created edition', done => {
    const frenchLang = 'wd:Q150'
    resolveAndCreate({
      edition: { isbn: generateIsbn13(), claims: { 'wdt:P407': [ frenchLang ] } },
      works: [ { labels: { en: randomLabel() } } ]
    })
    .then(({ entries }) => entries)
    .then(entries => {
      const result = entries[0]
      should(result.edition.uri).be.ok()
      const { edition } = result
      return getByUris(edition.uri)
      .then(({ entities }) => entities)
      .then(entities => {
        const newWorkClaimValue = _.values(entities)[0].claims['wdt:P407'][0]
        newWorkClaimValue.should.equal(frenchLang)
        done()
      })
    })
    .catch(done)
  })

  it('should add optional claims to created works', done => {
    const goodReadsId = someGoodReadsId()
    resolveAndCreate({
      edition: { isbn: generateIsbn13() },
      works: [ { claims: { 'wdt:P2969': [ goodReadsId ] }, labels: { en: randomLabel() } } ]
    })
    .then(({ entries }) => entries)
    .then(entries => {
      const result = entries[0]
      should(result.edition.uri).be.ok()
      const { works } = result
      return getByUris(works.map(_.property('uri')))
      .then(({ entities }) => entities)
      .then(entities => {
        const newWorkClaimValue = _.values(entities)[0].claims['wdt:P2969'][0]
        newWorkClaimValue.should.equal(goodReadsId)
        done()
      })
    })
    .catch(done)
  })

  it('should add optional claims to created authors', done => {
    const goodReadsId = someGoodReadsId()
    resolveAndCreate({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { en: randomLabel() } } ],
      authors: [ { claims: { 'wdt:P2963': [ goodReadsId ] }, labels: { en: humanName() } } ]
    })
    .then(({ entries }) => entries)
    .then(entries => {
      const result = entries[0]
      should(result.edition.uri).be.ok()
      const { authors } = result
      return getByUris(authors.map(_.property('uri')))
      .then(({ entities }) => entities)
      .then(entities => {
        const newWorkClaimValue = _.values(entities)[0].claims['wdt:P2963'][0]
        newWorkClaimValue.should.equal(goodReadsId)
        done()
      })
    })
    .catch(done)
  })

  it('should add a batch timestamp to patches', done => {
    const startTime = Date.now()
    const entry = {
      edition: { isbn: generateIsbn13() },
      works: [ { claims: { 'wdt:P2969': [ someGoodReadsId() ] }, labels: { en: humanName() } } ]
    }
    resolveAndCreate(entry)
    .then(({ entries }) => entries)
    .then(entries => {
      const result = entries[0]
      const { uri: editionUri } = result.edition
      return getHistory(editionUri)
      .then(patches => {
        const patch = patches[0]
        patch.batch.should.be.a.Number()
        patch.batch.should.above(startTime)
        patch.batch.should.below(Date.now())
        done()
      })
    })
    .catch(done)
  })

  it('should add created authors to created works', done => {
    resolveAndCreate({
      edition: { isbn: generateIsbn13() },
      works: [ { labels: { en: randomLabel() } } ],
      authors: [ { labels: { en: humanName() } } ]
    })
    .then(({ entries }) => entries)
    .then(entries => {
      const result = entries[0]
      const workUri = result.works[0].uri
      return getByUris(workUri)
      .then(({ entities }) => entities)
      .then(entities => {
        const work = entities[workUri]
        const workAuthors = work.claims['wdt:P50']
        workAuthors.includes(result.authors[0].uri).should.be.true()
        done()
      })
    })
    .catch(done)
  })

  it('should create a work entity from the edition seed', done => {
    let title = randomLabel()
    title = randomLabel()
    const dutchLangUri = 'wd:Q7411'
    const dutchLangCode = 'nl'
    resolveAndCreate({
      edition: {
        isbn: generateIsbn13(),
        claims: { 'wdt:P1476': [ title ], 'wdt:P407': [ dutchLangUri ] }
      }
    })
    .then(({ entries }) => entries)
    .then(entries => {
      const work = entries[0].works[0]
      work.labels[dutchLangCode].should.equal(title)
      done()
    })
    .catch(done)
  })

  it('should not create works without labels', done => {
    const title = randomLabel()
    resolveAndCreate({
      edition: {
        isbn: generateIsbn13(),
        claims: { 'wdt:P1476': [ title ] }
      },
      works: [ {} ]
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid labels')
      done()
    })
    .catch(done)
  })
})
