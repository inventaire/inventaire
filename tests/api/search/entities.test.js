const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { wait } = __.require('lib', 'promises')
const { createWork, createHuman, createSerie, createCollection, createPublisher } = require('../fixtures/entities')
const { getByUris } = require('../utils/entities')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { search } = require('../utils/search')

describe('search:entities', () => {
  let human; let work; let serie; let collection; let publisher = {}

  before(async () => {
    // ensure wikidata uris are indexed
    const wikidataUris = [ 'wd:Q184226', 'wd:Q180736', 'wd:Q8337', 'wd:Q225946', 'wd:Q3409094' ]
    await getByUris(wikidataUris, null, false)

    // create and index all entities
    human = await createHuman()
    work = await createWork()
    serie = await createSerie()
    publisher = await createPublisher()
    collection = await createCollection()

    // only then wait for the loong elasticsearchUpdateDelay()
    await wait(elasticsearchUpdateDelay)
  })

  describe('humans', () => {
    it('should return a wikidata human', async () => {
      const results = await search('humans', 'Gilles Deleuze')
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('humans'))
      _.map(results, 'id').includes('Q184226').should.be.true()
    })

    it('should return a local human', async () => {
      const humanLabel = human.labels.en
      const results = await search('humans', humanLabel)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('humans'))
      _.map(results, 'id').includes(human._id).should.be.true()
    })
  })

  describe('works', () => {
    it('should return a local work', async () => {
      const workLabel = work.labels.en
      const results = await search('works', workLabel)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('works'))
      _.map(results, 'id').includes(work._id).should.be.true()
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
      const serieLabel = serie.labels.en
      const results = await search('series', serieLabel)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('series'))
      _.map(results, 'id').includes(serie._id).should.be.true()
    })

    it('should return a wikidata serie', async () => {
      const results = await search('series', 'Harry Potter')
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('series'))
      _.map(results, 'id').includes('Q8337').should.be.true()
    })
  })

  describe('collections', () => {
    it('should return a local collection', async () => {
      const collectionLabel = collection.claims['wdt:P1476'][0]
      const results = await search('collections', collectionLabel)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('collections'))

      _.map(results, 'id').includes(collection._id).should.be.true()
    })

    it('should return a wikidata collection', async () => {
      const results = await search('collections', 'Présence du futur')
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('collections'))
      _.map(results, 'id').includes('Q3409094').should.be.true()
    })
  })

  describe('publishers', () => {
    it('should return a local publisher', async () => {
      const publisherLabel = publisher.labels.en
      const results = await search('publishers', publisherLabel)
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('publishers'))
      _.map(results, 'id').includes(publisher._id).should.be.true()
    })

    it('should return a wikidata publisher', async () => {
      const results = await search('publishers', 'Les liens qui libèrent')
      results.should.be.an.Array()
      results.forEach(result => result.type.should.equal('publishers'))
      _.map(results, 'id').includes('Q3236382').should.be.true()
    })
  })
})
