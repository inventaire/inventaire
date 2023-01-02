import CONFIG from 'config'
import should from 'should'
import { wait } from '#lib/promises'
import { indexes } from '#db/elasticsearch/indexes'
import { createUser } from '../fixtures/users.js'
import { deleteUser } from '../utils/users.js'
import { getIndexedDoc } from '../utils/search.js'

const { index } = indexes.users
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch

describe('indexation:users', () => {
  it('should index a new user', async () => {
    const { _id, username } = await createUser()
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, _id)
    result.found.should.be.true()
    result._id.should.equal(_id)
    result._source.username.should.equal(username)
  })
})

describe('deindexation:users', () => {
  it('should unindex a deleted user', async () => {
    const user = await createUser()
    await wait(elasticsearchUpdateDelay)
    await deleteUser(user)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, user._id, { retry: false })
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })
})
