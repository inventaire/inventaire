const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { createWork, createHuman, createSerie, createCollection, createPublisher, humanName } = require('../fixtures/entities')
const { getByUris } = require('../utils/entities')
const { search, waitForIndexation } = require('../utils/search')
const { shouldNotBeCalled } = require('../utils/utils')
const wikidataUris = [ 'wd:Q184226', 'wd:Q180736', 'wd:Q8337', 'wd:Q225946', 'wd:Q3409094', 'wd:Q3236382' ]

describe('search:entities', () => {
  let human, work, serie, collection, publisher

  before(async () => {
    [ human, work, serie, publisher, collection ] = await Promise.all([
      // create and index all entities
      createHuman(),
      createWork(),
      createSerie(),
      createPublisher(),
      createCollection(),
      // Ensure wikidata uris are indexed
      getByUris(wikidataUris, null, false),
    ])

    await Promise.all([
      waitForIndexation('entities', human._id),
      waitForIndexation('entities', work._id),
      waitForIndexation('entities', serie._id),
      waitForIndexation('entities', publisher._id),
      waitForIndexation('entities', collection._id),
      ...wikidataUris.map(uri => waitForIndexation('wikidata', uri.split(':')[1]))
    ])
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
      // Without filter=inv, Wikidata collections sharing a word with the collectionLabel take all the place
      // and the test often fails
      // TODO: fix exact match
      const results = await search({ types: 'collections', search: collectionLabel, filter: 'inv' })
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

  describe('search:strict', () => {
    it('should reject types that are not entity', async () => {
      try {
        await search({ types: [ 'groups', 'users' ], strict: true }).then(shouldNotBeCalled)
      } catch (err) {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('strict search are restricted to entities types')
      }
    })

    it('should return exact match labels only', async () => {
      const humanLabel = human.labels.en
      const almostSameLabel = sameFirstNameLabel(humanLabel)
      const almostSameHuman = await createHuman({ labels: { en: almostSameLabel } })
      waitForIndexation('entities', almostSameHuman._id)

      const results = await search({ types: 'humans', search: humanLabel, strict: true })
      results.should.be.an.Array()
      const labelsInResults = results.map(_.property('label'))
      _.uniq(labelsInResults).should.deepEqual([ humanLabel ])
    })
  })
})

const sameFirstNameLabel = label => {
  const lastName = humanName().split(' ')[0]
  const labelNames = label.split(' ')
  labelNames[1] = lastName
  return labelNames.join(' ')
}
