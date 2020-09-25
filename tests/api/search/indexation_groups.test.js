const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { wait } = __.require('lib', 'promises')
const { createGroup } = require('../fixtures/groups')
const { elasticsearchUpdateDelay } = CONFIG.entitiesSearchEngine
const { getIndexedDoc } = require('../utils/search')
const { index } = __.require('elasticsearch', 'list').indexes.groups

describe('indexation:groups', () => {
  it('should index a new local entity', async () => {
    const { _id, name } = await createGroup()
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(index, _id)
    result.found.should.be.true()
    result._id.should.equal(_id)
    result._source.name.should.equal(name)
  })
})

describe('desindexation:groups', () => {
  xit('should unindex a deleted group', async () => {})
})
