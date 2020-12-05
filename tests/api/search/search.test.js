const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { publicReq, authReq, getUser, shouldNotBeCalled } = require('../utils/utils')
const { search, waitForIndexation } = require('../utils/search')
const { createGroup } = require('../fixtures/groups')

describe('search:global', () => {
  describe('parameters', () => {
    it('should reject empty searches', async () => {
      try {
        await publicReq('get', '/api/search?lang=en&types=works').then(shouldNotBeCalled)
      } catch (err) {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('missing parameter in query: search')
      }
    })
  })

  describe('types', () => {
    it('should reject search without types', async () => {
      try {
        await publicReq('get', '/api/search?search=yo&lang=en').then(shouldNotBeCalled)
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

    it('should reject queries mixing social and entities types', async () => {
      try {
        await search([ 'users', 'humans' ], 'foo').then(shouldNotBeCalled)
      } catch (err) {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.startWith('can not have both social and entity types')
      }
    })
  })

  describe('user', () => {
    it('should return a user', async () => {
      const user = await getUser()
      await waitForIndexation('users', user._id)
      const results = await search('users', user.username)
      results.should.be.an.Array()
      _.map(results, 'id').includes(user._id).should.be.true()
    })

    it('should only return users', async () => {
      const group = await createGroup()
      await waitForIndexation('groups', group._id)
      const results = await search('users', group.name)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('users'))
    })
  })

  describe('group', () => {
    it('should return a group', async () => {
      const group = await createGroup()
      await waitForIndexation('groups', group._id)
      const results = await search('groups', group.name)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('groups'))
      _.map(results, 'id').includes(group._id).should.be.true()
    })

    it('should not return a private group unless requester is a member', async () => {
      const group = await createGroup({ searchable: false })
      await waitForIndexation('groups', group._id)
      const results = await search('groups', group.name)
      _.map(results, 'id').includes(group._id).should.be.false()
      // The same request but authentified with a group member account should find the group
      const { results: refreshedResults } = await authReq('get', `/api/search?search=${group.name}&types=groups&lang=en`)
      _.map(refreshedResults, 'id').includes(group._id).should.be.true()
    })
  })
})
