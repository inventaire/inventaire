import CONFIG from 'config'
import { indexes } from '#db/elasticsearch/indexes'
import { createShelf } from '#fixtures/shelves'
import { randomWords } from '#fixtures/text'
import { createUser } from '#fixtures/users'
import { wait } from '#lib/promises'
import { updateShelf, deleteShelves } from '#tests/api/utils/shelves'
import { deleteUser } from '#tests/api/utils/users'
import { getIndexedDoc } from '../utils/search.js'

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
