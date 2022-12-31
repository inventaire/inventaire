import CONFIG from 'config'
import { wait } from 'lib/promises'
import { getIndexedDoc } from '../utils/search'
import { createShelf } from 'tests/api/fixtures/shelves'
import { randomWords } from 'tests/api/fixtures/text'
import { updateShelf, deleteShelves } from 'tests/api/utils/shelves'
import { createUser } from 'tests/api/fixtures/users'
import { deleteUser } from 'tests/api/utils/users'
import { indexes } from 'db/elasticsearch/indexes'
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { index } = indexes.shelves

describe('indexation:shelves', () => {
  it('should index a new shelf', async () => {
    const { shelf } = await createShelf()
    const { _id: shelfId } = shelf
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, shelfId)
    result.found.should.be.true()
    result._id.should.equal(shelfId)
  })

  it('should reindex an updated shelf', async () => {
    const { shelf } = await createShelf()
    const { _id: shelfId } = shelf
    const newName = randomWords(4)
    await updateShelf({ id: shelfId, attribute: 'name', value: newName })
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, shelfId)
    result.found.should.be.true()
    result._id.should.equal(shelfId)
    result._source.name.should.equal(newName)
  })
})

describe('deindexation:shelves', () => {
  it('should unindex a deleted shelf', async () => {
    const { shelf } = await createShelf()
    const { _id: shelfId } = shelf
    await wait(elasticsearchUpdateDelay)
    await deleteShelves({ ids: shelf._id })
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, shelfId, { retry: false })
    result.found.should.be.false()
  })

  it('should unindex a deleted user shelf', async () => {
    const user = await createUser()
    const { shelf } = await createShelf(user)
    const { _id: shelfId } = shelf
    await wait(elasticsearchUpdateDelay)
    await deleteUser(user)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, shelfId, { retry: false })
    result.found.should.be.false()
  })
})
