const _ = require('builders/utils')
require('should')
const { publicReq, authReq, getUser, shouldNotBeCalled } = require('../utils/utils')
const { search, waitForIndexation, firstNWords } = require('../utils/search')
const { createGroup } = require('../fixtures/groups')
const { createListing } = require('tests/api/fixtures/listings')

describe('search:global', () => {
  describe('parameters', () => {
    it('should reject empty searches', async () => {
      try {
        await publicReq('get', '/api/search?lang=en&types=works').then(shouldNotBeCalled)
      } catch (err) {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('missing parameter in query: search or claim')
      }
    })

    it('should not crashed when the search contains special characters', async () => {
      const query = encodeURIComponent("L'eau d\\o~uc/e/-e[n] ~pé*ril!~*")
      const { results } = await publicReq('get', `/api/search?lang=en&types=works&search=${query}`)
      results.should.be.an.Array()
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
      _.map(results, 'id').should.containEql(user._id)
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
      _.map(results, 'id').should.containEql(group._id)
    })

    it('should not return a private group unless requester is a member', async () => {
      const group = await createGroup({ searchable: false })
      await waitForIndexation('groups', group._id)
      const results = await search('groups', group.name)
      _.map(results, 'id').should.not.containEql(group._id)
      // The same request but authentified with a group member account should find the group
      const { results: refreshedResults } = await authReq('get', `/api/search?search=${group.name}&types=groups&lang=en`)
      _.map(refreshedResults, 'id').should.containEql(group._id)
    })
  })

  describe('listing', () => {
    it('should find a listing with words from the name', async () => {
      const { listing } = await createListing()
      await waitForIndexation('lists', listing._id)
      const results = await search('lists', firstNWords(listing.name, 2))
      results.should.be.an.Array()
      _.map(results, 'id').should.containEql(listing._id)
    })

    it('should find a listing with words from the description', async () => {
      const { listing } = await createListing()
      await waitForIndexation('lists', listing._id)
      const results = await search('lists', firstNWords(listing.description, 2))
      results.should.be.an.Array()
      _.map(results, 'id').should.containEql(listing._id)
    })
  })
})
