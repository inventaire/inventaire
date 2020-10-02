const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { wait } = __.require('lib', 'promises')
const randomString = __.require('lib', './utils/random_string')
const { createWork, randomLabel, createEditionFromWorks } = require('../fixtures/entities')
const { getRefreshedPopularityByUris } = require('../utils/entities')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { search } = require('../utils/search')

describe('search:entities:score', () => {
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
