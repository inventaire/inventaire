import CONFIG from 'config'
import should from 'should'
import { wait } from '#lib/promises'
import { indexes } from '#db/elasticsearch/indexes'
import { getUser } from '../utils/utils.js'
import { createGroup, membershipAction } from '../fixtures/groups.js'
import { getIndexedDoc } from '../utils/search.js'

const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { index } = indexes.groups

describe('indexation:groups', () => {
  it('should index a new group', async () => {
    const { _id, name } = await createGroup()
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, _id)
    result.found.should.be.true()
    result._id.should.equal(_id)
    result._source.name.should.equal(name)
  })
})

describe('deindexation:groups', () => {
  it('should unindex a deleted group', async () => {
    const groupCreator = await getUser()
    const group = await createGroup()
    await wait(elasticsearchUpdateDelay)
    await membershipAction(groupCreator, 'leave', group)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, group._id, { retry: false })
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })
})
