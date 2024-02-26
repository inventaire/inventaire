import should from 'should'
import {
  createEditionWithIsbn,
  generateIsbn13,
} from '#tests/api/fixtures/entities'
import { deleteByUris, getByUris } from '#tests/api/utils/entities'
import { authReq, publicReq } from '#tests/api/utils/utils'

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
      await deleteByUris([ uri ])
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
