const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { wait } = __.require('lib', 'promises')
const { createItem } = require('../fixtures/items')
const { deleteByIds } = require('../utils/items')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { getIndexedDoc } = require('../utils/search')
const { index } = __.require('elasticsearch', 'list').indexes.items

describe('indexation:items', () => {
  it('should index a new item', async () => {
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

describe('deindexation:items', () => {
  it('should unindex a deleted user', async () => {
    const item = await createItem()
    await wait(elasticsearchUpdateDelay)
    await deleteByIds(item._id)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, item._id)
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })
})
