const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { wait } = __.require('lib', 'promises')
const { createUser } = require('../fixtures/users')
const { elasticsearchUpdateDelay } = CONFIG.entitiesSearchEngine
const { getIndexedDoc } = require('../utils/search')
const { index } = __.require('elasticsearch', 'list').indexes.users

describe('indexation:users', () => {
  it('should index a new local entity', async () => {
    const { _id, username } = await createUser()
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, _id)
    result.found.should.be.true()
    result._id.should.equal(_id)
    result._source.username.should.equal(username)
  })
})

describe('desindexation:users', () => {
  xit('should unindex a deleted user', async () => {})
})
