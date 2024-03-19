import should from 'should'
import { indexes } from '#db/elasticsearch/indexes'
import { wait } from '#lib/promises'
import config from '#server/config'
import { createItem } from '../fixtures/items.js'
import { deleteItemsByIds, updateItems } from '../utils/items.js'
import { getIndexedDoc } from '../utils/search.js'

const { updateDelay: elasticsearchUpdateDelay } = config.elasticsearch
const { index } = indexes.items

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
    await updateItems({ ids: _id, attribute: 'details', value: 'foo' })
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, _id)
    result._source.details.should.equal('foo')
  })
})

describe('deindexation:items', () => {
  it('should unindex a deleted user', async () => {
    const item = await createItem()
    await wait(elasticsearchUpdateDelay)
    await deleteItemsByIds(item._id)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, item._id, { retry: false })
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })
})
