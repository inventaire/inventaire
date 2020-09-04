const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { wait } = __.require('lib', 'promises')
const randomString = __.require('lib', './utils/random_string')
const { createWork, createHuman, createSerie, randomLabel, createEditionFromWorks } = require('../fixtures/entities')
const { getRefreshedPopularityByUris } = require('../utils/entities')
const { elasticsearchUpdateDelay } = CONFIG.entitiesSearchEngine
const { search } = require('../utils/search')

describe('search:entities', () => {
  describe('humans', () => {
    it('should return a wikidata human', async () => {
      const results = await search('humans', 'Gilles Deleuze')
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('humans'))
      _.map(results, 'id').includes('Q184226').should.be.true()
    })

    it('should return a local human', async () => {
      const label = randomString(5)
      const entity = await createHuman({ labels: { en: label } })
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
      const entity = await createWork({ labels: { en: label } })
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
      const entity = await createSerie({ labels: { en: label } })
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

  describe('score', () => {
    it('should sort entities by global score', async () => {
      const fullMatchLabel = randomString(15)
      const partialMatchLabel = `${fullMatchLabel} a`
      const work = await createWork({ labels: { en: partialMatchLabel } })
      await Promise.all([
        createEditionFromWorks(work),
        createWork({ labels: { en: fullMatchLabel } })
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
      const work = await createWork({ labels: { en: workLabel } })
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
