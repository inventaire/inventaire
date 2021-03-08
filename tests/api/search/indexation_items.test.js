const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { wait } = require('lib/promises')
const { createItem } = require('../fixtures/items')
const { deleteByIds, update } = require('../utils/items')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { getIndexedDoc } = require('../utils/search')
const { index } = require('db/elasticsearch/list').indexes.items

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

  it('should reindex an updated item', async () => {
    const { _id } = await createItem()
    await update(_id, 'details', 'foo')
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, _id)
    result._source.details.should.equal('foo')
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
