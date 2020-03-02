const should = require('should')
const { undesiredRes } = require('../utils/utils')
const { ensureEditionExists, createWorkWithAuthor, createEditionWithWorkAuthorAndSerie, createHuman } = require('../fixtures/entities')
const { getByUris, merge } = require('../utils/entities')
const workWithAuthorPromise = createWorkWithAuthor()

describe('entities:get:by-uris', () => {
  it('should reject invalid uri', done => {
    const invalidUri = 'bla'
    getByUris(invalidUri)
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid uri')
      done()
    })
    .catch(done)
  })

  it('should reject uri with wrong prefix', done => {
    const invalidUri = 'foo:Q535'
    getByUris(invalidUri)
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid uri')
      done()
    })
    .catch(done)
  })

  it('should accept inventaire uri', done => {
    workWithAuthorPromise
    .then(work => {
      return getByUris(work.uri)
      .then(res => {
        res.entities[work.uri].should.be.an.Object()
        done()
      })
    })
    .catch(done)
  })

  it('should return uris not found', done => {
    const fakeUri = 'inv:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    getByUris(fakeUri)
    .then(res => {
      res.notFound.should.deepEqual([ fakeUri ])
      done()
    })
    .catch(done)
  })

  it('should return redirected uris', async () => {
    const [ humanA, humanB ] = await Promise.all([ createHuman(), createHuman() ])
    await merge(humanA.uri, humanB.uri)
    const { entities, notFound, redirects } = await getByUris(humanA.uri)
    Object.keys(entities).length.should.equal(1)
    entities[humanB.uri].should.be.an.Object()
    entities[humanB.uri].uri.should.equal(humanB.uri)
    redirects[humanA.uri].should.equal(humanB.uri)
    should(notFound).not.be.ok()
  })

  it('should accept wikidata uri', done => {
    const validWdUri = 'wd:Q2300248'
    ensureEditionExists(validWdUri)
    .then(() => getByUris(validWdUri))
    .then(res => {
      const entity = res.entities[validWdUri]
      entity.uri.should.equal(validWdUri)
      done()
    })
    .catch(done)
  })

  it('should accept strict ISBN 13 syntax', done => {
    const isbn13Uri = 'isbn:9782845652217'
    ensureEditionExists(isbn13Uri)
    .then(() => getByUris(isbn13Uri))
    .then(res => {
      const entity = res.entities[isbn13Uri]
      entity.uri.should.equal(isbn13Uri)
      done()
    })
    .catch(done)
  })

  describe('relatives', () => {
    it("should accept a 'relatives' parameter", done => {
      workWithAuthorPromise
      .then(work => {
        const { uri: workUri } = work
        const authorUri = work.claims['wdt:P50'][0]
        return getByUris(workUri, 'wdt:P50')
        .then(res => {
          res.entities[workUri].should.be.an.Object()
          res.entities[authorUri].should.be.an.Object()
          done()
        })
      })
      .catch(done)
    })

    it("should reject a non-whitelisted 'relatives' parameter", done => {
      workWithAuthorPromise
      .then(work => {
        const { uri: workUri } = work
        return getByUris(workUri, 'wdt:P31')
        .then(undesiredRes(done))
        .catch(err => {
          err.statusCode.should.equal(400)
          err.body.status_verbose.should.startWith('invalid relative')
          done()
        })
      })
      .catch(done)
    })

    it('should be able to include the works, authors, and series of an edition', done => {
      createEditionWithWorkAuthorAndSerie()
      .then(({ uri }) => uri)
      .then(editionUri => {
        return getByUris(editionUri, 'wdt:P50|wdt:P179|wdt:P629')
        .then(res => {
          const edition = res.entities[editionUri]
          edition.should.be.an.Object()

          const workUri = edition.claims['wdt:P629'][0]
          const work = res.entities[workUri]
          work.should.be.an.Object()

          const authorUri = work.claims['wdt:P50'][0]
          const author = res.entities[authorUri]
          author.should.be.an.Object()

          const serieUri = work.claims['wdt:P179'][0]
          const serie = res.entities[serieUri]
          serie.should.be.an.Object()

          done()
        })
      })
      .catch(done)
    })
  })
})
