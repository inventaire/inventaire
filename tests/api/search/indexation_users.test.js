const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { wait } = __.require('lib', 'promises')
const { createUser } = require('../fixtures/users')
const { deleteUser } = require('../utils/users')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { getIndexedDoc } = require('../utils/search')
const { index } = __.require('elasticsearch', 'list').indexes.users

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
    const result = await getIndexedDoc(index, user._id)
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })
})
