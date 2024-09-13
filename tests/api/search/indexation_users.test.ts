import should from 'should'
import { indexes } from '#db/elasticsearch/indexes'
import { createUser } from '#fixtures/users'
import { wait } from '#lib/promises'
import config from '#server/config'
import { getIndexedDoc } from '#tests/api/utils/search'
import { deleteUser } from '#tests/api/utils/users'

const { index } = indexes.users
const { updateDelay: elasticsearchUpdateDelay } = config.elasticsearch

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
