const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { wait } = __.require('lib', 'promises')
const { createItem } = require('../fixtures/items')
const { elasticsearchUpdateDelay } = CONFIG.entitiesSearchEngine
const { getIndexedDoc } = require('../utils/search')
const { index } = __.require('elasticsearch', 'list').indexes.items

describe('indexation:items', () => {
  it('should index a new local entity', async () => {
    const { _id, entity, owner, snapshot } = await createItem()
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, _id)
    result.found.should.be.true()
    result._id.should.equal(_id)
    result._source.entity.should.equal(entity)
    result._source.owner.should.equal(owner)
    result._source.snapshot.should.deepEqual(snapshot)
  })
})

describe('desindexation:items', () => {
  xit('should unindex a deleted user', async () => {})
})
