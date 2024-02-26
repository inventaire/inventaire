import should from 'should'
import {
  createEdition,
  createEditionWithIsbn,
  createHuman,
  createWorkWithAuthor,
  someFakeUri,
} from '#tests/api/fixtures/entities'
import { getByUris, merge } from '#tests/api/utils/entities'
import { rethrowShouldNotBeCalledErrors, shouldNotBeCalled } from '#tests/unit/utils'

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
})
