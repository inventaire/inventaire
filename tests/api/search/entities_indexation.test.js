const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { wait } = __.require('lib', 'promises')
const { createHuman } = require('../fixtures/entities')
const { deleteByUris, merge } = require('../utils/entities')
const { elasticsearchUpdateDelay } = CONFIG.entitiesSearchEngine
const entitiesIndex = CONFIG.db.name('entities')
const { checkIndexation } = require('../utils/search')

describe('entities:indexation', () => {
  it('should index a new local entity', async () => {
    const { _id } = await createHuman()
    await wait(elasticsearchUpdateDelay)
    const result = await checkIndexation(entitiesIndex, 'humans', _id)
    result.found.should.be.true()
    result._source.id.should.equal(_id)
  })
})

describe('entities:desindexation', () => {
  it('should unindex a deleted local entity', async () => {
    const { _id, uri } = await createHuman()
    await wait(elasticsearchUpdateDelay)
    await deleteByUris(uri)
    await wait(elasticsearchUpdateDelay)
    const result = await checkIndexation(entitiesIndex, 'humans', _id)
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })

  it('should unindex a merged local entity', async () => {
    const { _id, uri } = await createHuman()
    const { uri: otherUri } = await createHuman()
    await wait(elasticsearchUpdateDelay)
    await merge(uri, otherUri)
    await wait(elasticsearchUpdateDelay)
    const result = await checkIndexation(entitiesIndex, 'humans', _id)
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })
})
