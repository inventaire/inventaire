const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const faker = require('faker')
const { wait } = __.require('lib', 'promises')
const { nonAuthReq, authReq, getUser, shouldNotBeCalled } = require('../utils/utils')
const { elasticsearchUpdateDelay } = CONFIG.entitiesSearchEngine
const { search } = require('../utils/search')

describe('search:global', () => {
  describe('parameters', () => {
    it('should reject empty searches', async () => {
      try {
        await nonAuthReq('get', '/api/search?lang=en&types=works').then(shouldNotBeCalled)
      } catch (err) {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('missing parameter in query: search')
      }
    })
  })

  describe('types', () => {
    it('should reject search without types', async () => {
      try {
        await nonAuthReq('get', '/api/search?search=yo&lang=en').then(shouldNotBeCalled)
      } catch (err) {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('missing parameter in query: types')
      }
    })

    it('should reject invalid types', async () => {
      try {
        await search('da', 'yo').then(shouldNotBeCalled)
      } catch (err) {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.startWith('invalid types: da')
      }
    })
  })

  describe('user', () => {
    it('should return a user', async () => {
      const user = await getUser()
      await wait(elasticsearchUpdateDelay)
      const results = await search('users', user.username)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('users'))
      _.map(results, 'id').includes(user._id).should.be.true()
    })
  })

  describe('group', () => {
    it('should return a group', async () => {
      const name = `group ${faker.lorem.word}`
      const group = await authReq('post', '/api/groups?action=create', { name })
      await wait(elasticsearchUpdateDelay)
      const results = await search('groups', name)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('groups'))
      _.map(results, 'id').includes(group._id).should.be.true()
    })

    it('should not return a private group unless requester is a member', async () => {
      const name = `group ${faker.lorem.word}`
      const group = await authReq('post', '/api/groups?action=create', { name, searchable: false })
      await wait(elasticsearchUpdateDelay)
      const results = await search('groups', name)
      _.map(results, 'id').includes(group._id).should.be.false()
      // The same request but authentified with a group member account should find the group
      const { results: refreshedResults } = await authReq('get', `/api/search?search=${name}&types=groups&lang=en`)
      _.map(refreshedResults, 'id').includes(group._id).should.be.true()
    })
  })
})
