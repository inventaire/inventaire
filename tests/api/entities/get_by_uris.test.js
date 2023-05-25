import should from 'should'
import { getWdEntity } from '#data/wikidata/get_entity'
import { buildUrl } from '#lib/utils/url'
import { rethrowShouldNotBeCalledErrors, shouldNotBeCalled } from '#tests/unit/utils'
import {
  createEdition,
  createEditionWithIsbn,
  createEditionWithWorkAuthorAndSerie,
  createHuman,
  createWorkWithAuthor,
  generateIsbn13,
  someFakeUri,
} from '../fixtures/entities.js'
import { deleteByUris, getByUris, getEntitiesAttributesByUris, merge } from '../utils/entities.js'
import { authReq, publicReq } from '../utils/utils.js'

const workWithAuthorPromise = createWorkWithAuthor()

describe('entities:get:by-uris', () => {
  it('should reject invalid uri', async () => {
    const invalidUri = 'bla'
    try {
      await getByUris(invalidUri)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid uri')
    }
  })

  it('should reject uri with wrong prefix', async () => {
    const invalidUri = 'foo:Q535'
    try {
      await getByUris(invalidUri)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid uri')
    }
  })

  it('should accept inventaire uri', async () => {
    const work = await workWithAuthorPromise
    const res = await getByUris(work.uri)
    res.entities[work.uri].should.be.an.Object()
  })

  it('should return inventaire uris not found', async () => {
    const { notFound } = await getByUris(someFakeUri)
    notFound.should.deepEqual([ someFakeUri ])
  })

  it('should return isbn uris not found', async () => {
    const someMissingIsbn = 'isbn:9789871453023'
    const { notFound } = await getByUris(someMissingIsbn)
    notFound.should.deepEqual([ someMissingIsbn ])
  })

  it('should return wikidata uris not found', async () => {
    const nonExistingUri = 'wd:Q5359999999999999'
    const { notFound } = await getByUris(nonExistingUri, null, true)
    notFound.should.deepEqual([ nonExistingUri ])
  })

  it('should return wikidata found and not found uris', async () => {
    const existingUri = 'wd:Q1345582'
    const nonExistingUriA = 'wd:Q5359999999999998'
    const nonExistingUriB = 'wd:Q5359999999999999'
    const { entities, notFound } = await getByUris([ existingUri, nonExistingUriA, nonExistingUriB ], null, true)
    entities[existingUri].uri.should.equal(existingUri)
    notFound.should.containEql(nonExistingUriA)
    notFound.should.containEql(nonExistingUriB)
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

  it('should accept wikidata uri', async () => {
    const validWdUri = 'wd:Q2300248'
    const { entities } = await getByUris(validWdUri)
    const entity = entities[validWdUri]
    entity.uri.should.equal(validWdUri)
  })

  it('should accept strict ISBN 13 syntax', async () => {
    const { uri } = await createEditionWithIsbn()
    uri.should.match(/isbn:\d{13}/)
    const { entities } = await getByUris(uri)
    const entity = entities[uri]
    entity.uri.should.equal(uri)
  })

  it('should set terms from claims on editions', async () => {
    const { uri, claims } = await createEdition()
    const { entities } = await getByUris(uri)
    const entity = entities[uri]
    entity.labels.fromclaims.should.equal(claims['wdt:P1476'][0])
    entity.descriptions.fromclaims.should.equal(claims['wdt:P1680'][0])
  })

  describe('attributes', () => {
    it("should return only the requested 'attributes'", async () => {
      const work = await workWithAuthorPromise
      const { uri: invWorkUri } = work
      const invAuthorUri = work.claims['wdt:P50'][0]
      const wdUri = 'wd:Q2300248'
      const entities = await getEntitiesAttributesByUris({
        uris: [ invWorkUri, invAuthorUri, wdUri ],
        attributes: [ 'labels', 'descriptions' ],
      })
      entities[invWorkUri].uri.should.be.ok()
      entities[invAuthorUri].uri.should.be.ok()
      entities[wdUri].uri.should.be.ok()
      entities[invWorkUri].labels.should.be.ok()
      entities[invAuthorUri].labels.should.be.ok()
      entities[wdUri].labels.should.be.ok()
      entities[wdUri].descriptions.should.be.ok()
      should(entities[invWorkUri].claims).not.be.ok()
      should(entities[invAuthorUri].claims).not.be.ok()
      should(entities[wdUri].aliases).not.be.ok()
      should(entities[wdUri].claims).not.be.ok()
      should(entities[wdUri].sitelinks).not.be.ok()
    })

    it('should get relatives attributes', async () => {
      const { uri: editionUri } = await createEditionWithWorkAuthorAndSerie()
      let entities = await getEntitiesAttributesByUris({
        uris: editionUri,
        attributes: [ 'info', 'labels' ],
        relatives: [ 'wdt:P50', 'wdt:P179', 'wdt:P629' ],
      })
      entities = Object.values(entities)
      const edition = entities.find(entity => entity.type === 'edition')
      const work = entities.find(entity => entity.type === 'work')
      const serie = entities.find(entity => entity.type === 'serie')
      const human = entities.find(entity => entity.type === 'human')
      edition.labels.fromclaims.should.be.ok()
      work.labels.en.should.be.ok()
      serie.labels.en.should.be.ok()
      human.labels.en.should.be.ok()
    })

    it('should return entities dry popularity', async () => {
      const { uri: editionUri } = await createEditionWithWorkAuthorAndSerie()
      const entities = await getEntitiesAttributesByUris({
        uris: [ editionUri ],
        attributes: [ 'info', 'labels', 'popularity' ],
        relatives: [ 'wdt:P50', 'wdt:P179', 'wdt:P629' ],
      })
      Object.values(entities).forEach(entity => {
        entity.popularity.should.equal(0)
      })
    })

    it('should return entities fresh popularity', async () => {
      const { uri: editionUri } = await createEditionWithWorkAuthorAndSerie()
      const entities = await getEntitiesAttributesByUris({
        uris: [ editionUri ],
        attributes: [ 'info', 'labels', 'popularity' ],
        relatives: [ 'wdt:P50', 'wdt:P179', 'wdt:P629' ],
        refresh: true,
      })
      Object.values(entities).forEach(entity => {
        if (entity.type === 'edition') entity.popularity.should.equal(0)
        else entity.popularity.should.be.above(0)
      })
    })
  })

  describe('lang', () => {
    it('should return only the requested lang (with attributes)', async () => {
      const wdHumanUri = 'wd:Q2300248'
      const { uri: invHumanUri } = await createHuman({ labels: { es: 'foo', fr: 'bar' } })
      const url = buildUrl('/api/entities', {
        action: 'by-uris',
        uris: `${invHumanUri}|${wdHumanUri}`,
        attributes: 'labels',
        lang: 'es',
      })
      const { entities } = await publicReq('get', url)
      Object.keys(entities[invHumanUri].labels).should.deepEqual([ 'es' ])
      entities[invHumanUri].labels.es.should.equal('foo')
      Object.keys(entities[wdHumanUri].labels).should.deepEqual([ 'es' ])
    })

    it('should return only the requested lang (without attributes)', async () => {
      const wdHumanUri = 'wd:Q2300248'
      const { uri: invHumanUri } = await createHuman({ labels: { es: 'foo', fr: 'bar' } })
      const url = buildUrl('/api/entities', {
        action: 'by-uris',
        uris: `${invHumanUri}|${wdHumanUri}`,
        lang: 'es',
      })
      const { entities } = await publicReq('get', url)
      Object.keys(entities[invHumanUri].labels).should.deepEqual([ 'es' ])
      entities[invHumanUri].labels.es.should.equal('foo')
      Object.keys(entities[wdHumanUri].labels).should.deepEqual([ 'es' ])
    })

    it('should fallback on what is available', async () => {
      const { uri: invHumanUri } = await createHuman({ labels: { es: 'foo' } })
      const url = buildUrl('/api/entities', {
        action: 'by-uris',
        uris: `${invHumanUri}`,
        attributes: 'labels',
        lang: 'fr',
      })
      const { entities } = await publicReq('get', url)
      Object.keys(entities[invHumanUri].labels).should.deepEqual([ 'es' ])
      entities[invHumanUri].labels.es.should.equal('foo')
    })
  })

  describe('relatives', () => {
    it("should accept a 'relatives' parameter", async () => {
      const work = await workWithAuthorPromise
      const { uri: workUri } = work
      const authorUri = work.claims['wdt:P50'][0]
      const res = await getByUris(workUri, 'wdt:P50')
      res.entities[workUri].should.be.an.Object()
      res.entities[authorUri].should.be.an.Object()
    })

    it("should reject a non-allowlisted 'relatives' parameter", async () => {
      const work = await workWithAuthorPromise
      const { uri: workUri } = work
      try {
        await getByUris(workUri, 'wdt:P31')
        .then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.startWith('invalid relative')
      }
    })

    it('should be able to include the works, authors, and series of an edition', async () => {
      const { uri: editionUri } = await createEditionWithWorkAuthorAndSerie()
      const res = await getByUris(editionUri, 'wdt:P50|wdt:P179|wdt:P629')
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
    })
  })
})

describe('entities:get:by-isbns', () => {
  it('should return existing edition', async () => {
    const { uri } = await createEditionWithIsbn()
    const res = await getByUris(uri)
    res.entities[uri].should.be.an.Object()
    res.entities[uri].uri.should.equal(uri)
    should(res.notFound).not.be.ok()
  })

  describe('autocreate', () => {
    it('should return editions isbn in notFound array when autocreation is false', async () => {
      const uri = `isbn:${generateIsbn13()}`
      const res = await authReq('get', `/api/entities?action=by-uris&uris=${uri}&autocreate=false`)
      res.entities.should.deepEqual({})
      res.notFound[0].should.equal(uri)
    })

    it('should return editions isbn in notFound array when autocreation is true', async () => {
      const isbnUnknownBySeedsSources = '9783981898743'
      const uri = `isbn:${isbnUnknownBySeedsSources}`
      const res = await authReq('get', `/api/entities?action=by-uris&uris=${uri}&autocreate=true`)
      res.entities.should.deepEqual({})
      res.notFound[0].should.equal(uri)
    })

    it('should autocreate from authorities seed when autocreation is true', async () => {
      const isbnKnownBySeedsSources = '9782207116746'
      const uri = `isbn:${isbnKnownBySeedsSources}`
      await deleteByUris([ uri ])
      const { notFound } = await authReq('get', `/api/entities?action=by-uris&uris=${uri}&autocreate=false`)
      notFound.should.deepEqual([ uri ])
      const res = await authReq('get', `/api/entities?action=by-uris&uris=${uri}&autocreate=true`)
      const entity = res.entities[uri]
      entity.should.be.an.Object()
      entity.uri.should.equal(uri)
      should(res.notFound).not.be.ok()
    })

    // Requires a running dataseed service and CONFIG.dataseed.enabled=true
    xit('should autocreate from dataseed seed when autocreation is true', async () => {
      const isbnKnownByDataseed = '9783030917043'
      const uri = `isbn:${isbnKnownByDataseed}`
      await deleteByUris([ uri ])
      const { notFound } = await authReq('get', `/api/entities?action=by-uris&uris=${uri}&autocreate=false`)
      notFound.should.deepEqual([ uri ])
      const res = await authReq('get', `/api/entities?action=by-uris&uris=${uri}&autocreate=true`)
      const entity = res.entities[uri]
      entity.should.be.an.Object()
      entity.uri.should.equal(uri)
      should(res.notFound).not.be.ok()
    })

    it('should not create duplicates when called in parallel', async () => {
      const isbnKnownBySeedsSources = '9782207116746'
      const uri = `isbn:${isbnKnownBySeedsSources}`
      await deleteByUris([ uri ])
      const { notFound } = await authReq('get', `/api/entities?action=by-uris&uris=${uri}&autocreate=false`)
      notFound.should.deepEqual([ uri ])
      const [ res1, res2 ] = await Promise.all([
        publicReq('get', `/api/entities?action=by-uris&uris=${uri}&autocreate=true`),
        publicReq('get', `/api/entities?action=by-uris&uris=${uri}&autocreate=true`),
      ])
      const entity1 = res1.entities[uri]
      const entity2 = res2.entities[uri]
      entity1._id.should.equal(entity2._id)
    })
  })
})

describe('wikidata qualifiers adapter', () => {
  it('should flatten wikidata qualifier properties used as mainsnak in inventaire', async () => {
    const id = 'Q3024217'
    const uri = `wd:${id}`

    // The test relies on the state of an entity on Wikidata that needs
    // to be checked to assert that we are actually testing the desired behavior
    const rawEntity = await getWdEntity(id)
    if (rawEntity.claims.P1545) throw new Error(`${id} should not have a P1545 claim`)

    const { entities } = await getByUris(uri, null, true)
    const entity = entities[uri]
    entity.claims['wdt:P179'].should.deepEqual([ 'wd:Q1130014' ])
    // This claim is expected to be a qualifier from the one above
    entity.claims['wdt:P1545'].should.deepEqual([ '111' ])
  })

  it('should not flatten wikidata qualifier properties when there are too many', async () => {
    const id = 'Q54802792'
    const uri = `wd:${id}`

    // The test relies on the state of an entity on Wikidata that needs
    // to be checked to assert that we are actually testing the desired behavior
    const rawEntity = await getWdEntity(id)
    if (rawEntity.claims.P179.length !== 2) throw new Error(`${id} should have 2 P179 claims`)
    if (rawEntity.claims.P1545) throw new Error(`${id} should not have a P1545 claim`)

    const { entities } = await getByUris(uri, null, true)
    const entity = entities[uri]
    should(entity.claims['wdt:P1545']).not.be.ok()
  })
})
