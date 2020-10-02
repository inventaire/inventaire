const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { wait } = __.require('lib', 'promises')
const { getUser } = require('../utils/utils')
const { createGroup, membershipAction } = require('../fixtures/groups')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { getIndexedDoc } = require('../utils/search')
const { index } = __.require('elasticsearch', 'list').indexes.groups

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
    const result = await getIndexedDoc(index, group._id)
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })
})
