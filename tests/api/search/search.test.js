const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const faker = require('faker')
const { wait } = __.require('lib', 'promises')
const { nonAuthReq, authReq, getUser, shouldNotBeCalled } = require('../utils/utils')
const randomString = __.require('lib', './utils/random_string')
const { createWork, createHuman, createSerie, randomLabel, createEditionFromWorks } = require('../fixtures/entities')
const { getRefreshedPopularityByUris } = require('../utils/entities')
const { elasticsearchUpdateDelay } = CONFIG.entitiesSearchEngine

describe('search:global', () => {
  describe('parameters', () => {
    it('should reject empty searches', async () => {
      try {
        await nonAuthReq('get', '/api/search?lang=fr&types=works').then(shouldNotBeCalled)
      } catch (err) {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('missing parameter in query: search')
      }
    })
  })

  describe('types', () => {
    it('should reject search without types', async () => {
      try {
        await nonAuthReq('get', '/api/search?search=yo&lang=fr').then(shouldNotBeCalled)
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

  describe('humans', () => {
    it('should return a wikidata human', async () => {
      const results = await search('humans', 'Gilles Deleuze')
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('humans'))
      _.map(results, 'id').includes('Q184226').should.be.true()
    })

    it('should return a local human', async () => {
      const label = randomString(5)
      const entity = await createHuman({ labels: { fr: label } })
      await wait(elasticsearchUpdateDelay)
      const results = await search('humans', label)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('humans'))
      _.map(results, 'id').includes(entity._id).should.be.true()
    })
  })

  describe('works', () => {
    it('should return a local work', async () => {
      const label = randomString(5)
      const entity = await createWork({ labels: { fr: label } })
      await wait(elasticsearchUpdateDelay)
      const results = await search('works', label)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('works'))
      _.map(results, 'id').includes(entity._id).should.be.true()
    })

    it('should return a wikidata work', async () => {
      const results = await search('works', 'Les Misérables')
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('works'))
      _.map(results, 'id').includes('Q180736').should.be.true()
    })
  })

  describe('series', () => {
    it('should return a local serie', async () => {
      const label = randomLabel()
      const entity = await createSerie({ labels: { fr: label } })
      await wait(elasticsearchUpdateDelay)
      const results = await search('series', label)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('series'))
      _.map(results, 'id').includes(entity._id).should.be.true()
    })

    it('should return a wikidata serie', async () => {
      const results = await search('series', 'Harry Potter')
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('series'))
      _.map(results, 'id').includes('Q8337').should.be.true()
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
      const { results: refreshedResults } = await authReq('get', `/api/search?search=${name}&types=groups&lang=fr`)
      _.map(refreshedResults, 'id').includes(group._id).should.be.true()
    })
  })

  describe('score', () => {
    it('should sort entities by global score', async () => {
      const fullMatchLabel = randomString(15)
      const partialMatchLabel = `${fullMatchLabel} a`
      const work = await createWork({ labels: { fr: partialMatchLabel } })
      await Promise.all([
        createEditionFromWorks(work),
        createWork({ labels: { fr: fullMatchLabel } })
      ])
      // Trigger a popularity refresh to avoid getting the default score on the search hereafter
      await getRefreshedPopularityByUris(work.uri)
      await wait(elasticsearchUpdateDelay)
      const workWithEditionUri = work.uri
      const results = await search('works', fullMatchLabel)
      const firstResultUri = results[0].uri
      firstResultUri.should.equal(workWithEditionUri)
    })

    it('should return a global score boosted by a logarithmic popularity', async () => {
      const workLabel = randomLabel()
      const work = await createWork({ labels: { fr: workLabel } })
      const editions = await Promise.all([
        createEditionFromWorks(work),
        createEditionFromWorks(work)
      ])
      // trigger a popularity refresh to avoid getting the default score on
      // the search hereafter
      await getRefreshedPopularityByUris(_.map(editions, 'uri'))
      await wait(elasticsearchUpdateDelay)
      const results = await search('works', workLabel)
      const firstEntityResult = results[0]
      const popularity = editions.length
      const boostLimit = firstEntityResult.lexicalScore * popularity
      firstEntityResult.globalScore.should.be.below(boostLimit)
    })
  })
})

const search = async (types, search) => {
  search = encodeURIComponent(search)
  const { results } = await nonAuthReq('get', `/api/search?search=${search}&types=${types}&lang=fr&limit=50`)
  return results
}
