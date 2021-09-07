const _ = require('builders/utils')
require('should')
const { createWork, createHuman, createSerie, createCollection, createPublisher, sameFirstNameLabel, createWorkWithAuthor, createSerieWithAuthor, createWorkWithSerie, humanName } = require('../fixtures/entities')
const { randomLongWord, randomWords } = require('../fixtures/text')
const { getByUris } = require('../utils/entities')
const { shouldNotBeCalled } = require('../utils/utils')
const { search, waitForIndexation, getIndexedDoc } = require('../utils/search')
const wikidataUris = [ 'wd:Q184226', 'wd:Q180736', 'wd:Q8337', 'wd:Q225946', 'wd:Q3409094', 'wd:Q3236382' ]
const { max_gram: maxGram } = require('db/elasticsearch/settings/settings').analysis.filter.autocomplete_filter

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
      // Ensure wikidata uris are indexed in the current format
      getByUris(wikidataUris, null, true),
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

  describe('parameters', () => {
    describe('exact', () => {
      it('should reject types that are not entity related', async () => {
        try {
          await search({ types: [ 'groups', 'users' ], search: 'foo', exact: true }).then(shouldNotBeCalled)
        } catch (err) {
          err.statusCode.should.equal(400)
          err.body.status_verbose.should.equal('exact search is restricted to entity types')
        }
      })

      // Ex: when requesting 'Myron Howe', 'Myron W Howe' will be considered an exact match
      it('should return only results including exact matches of each words', async () => {
        const humanLabel = human.labels.en
        const results = await search({ types: 'humans', search: humanLabel, lang: 'en', exact: true })
        results.length.should.be.aboveOrEqual(1)
        const labelWords = humanLabel.split(' ')
        results.forEach(result => {
          result.label.should.equal(humanLabel)
          const resultLabelWords = result.label.split(' ')
          labelWords.forEach(word => {
            resultLabelWords.includes(word).should.be.true()
          })
        })
      })

      it('should accept a different word order', async () => {
        const humanLabel = human.labels.en
        const reversedLabel = humanLabel.split(' ').reverse().join(' ')
        const results = await search({ types: 'humans', search: reversedLabel, lang: 'en', exact: true })
        results.length.should.be.aboveOrEqual(1)
        results.forEach(result => result.label.should.equal(humanLabel))
      })

      it('should not return same first name human', async () => {
        const humanLabel = human.labels.en
        const almostSameLabel = sameFirstNameLabel(humanLabel)
        const almostSameHuman = await createHuman({ labels: { en: almostSameLabel } })
        await waitForIndexation('entities', almostSameHuman._id)

        const results = await search({ types: 'humans', search: humanLabel, lang: 'en', exact: true })
        results.should.be.an.Array()
        const labelsInResults = results.map(_.property('label'))
        _.uniq(labelsInResults).should.deepEqual([ humanLabel ])
      })

      it('should not match on descriptions', async () => {
        const description = 'french philosopher'
        const results = await search({ types: 'humans', search: description, lang: 'en' })
        results.length.should.be.aboveOrEqual(0)
        const exactResults = await search({ types: 'humans', search: description, lang: 'en', exact: true })
        exactResults.length.should.equal(0)
      })

      it('should find a label with special characters', async () => {
        // Insert random words in the middle to mitigate a too low score due to a high term frequency
        // when running the tests several times without emptying the database
        const label = `L'eau ${randomWords(2)} en péril !`
        const work = await createWork({ labels: { fr: label } })
        await waitForIndexation('entities', work._id)
        const results = await search({ types: 'works', search: label, lang: 'fr', exact: true })
        _.map(results, 'uri').should.containEql(work.uri)
      })

      it('should ignore the case', async () => {
        // Insert random words in the middle to mitigate a too low score due to a high term frequency
        // when running the tests several times without emptying the database
        const label = `L'EAU DOUCE ${randomWords(2).toUpperCase()} EN PÉRIL`
        const work = await createWork({ labels: { fr: label.toLowerCase() } })
        await waitForIndexation('entities', work._id)
        const results = await search({ types: 'works', search: label, lang: 'fr', exact: true })
        _.map(results, 'uri').should.containEql(work.uri)
      })

      it('should find a label containing terms longer than the autocomplete max ngram', async () => {
        const wordLength = maxGram + 5
        const label = `${randomLongWord(wordLength)} ${randomLongWord(wordLength)} ${randomLongWord(wordLength)}`
        const work = await createWork({ labels: { de: label } })
        await waitForIndexation('entities', work._id)
        const results = await search({ types: 'works', search: label, lang: 'de', exact: true })
        _.map(results, 'uri').should.containEql(work.uri)
      })
    })

    describe('not exact', () => {
      it('should match flattened terms', async () => {
        const doc = await getIndexedDoc('wikidata', 'Q8337')
        const firstTwoFlattenedLabelsWords = doc._source.flattenedLabels.split(' ').slice(0, 2).join(' ')
        const results = await search({ types: 'series', search: firstTwoFlattenedLabelsWords })
        _.map(results, 'uri').should.containEql('wd:Q8337')
      })
    })

    describe('min score', () => {
      it('should not return results below the specified score', async () => {
        const label = `${randomLongWord(10)} ${randomLongWord(10)} ${randomLongWord(10)}`
        const almostSameLabel = sameFirstNameLabel(label)
        const [ humanA, humanB ] = await Promise.all([
          createHuman({ labels: { en: label } }),
          createHuman({ labels: { en: almostSameLabel } }),
        ])
        await Promise.all([
          waitForIndexation('entities', humanA._id),
          waitForIndexation('entities', humanB._id),
        ])
        const results = await search({ types: 'humans', search: label, lang: 'en', filter: 'inv' })
        const humanAScore = results.find(entity => entity.id === humanA._id)._score
        const humanBScore = results.find(entity => entity.id === humanB._id)._score
        humanAScore.should.be.above(humanBScore + 2)
        const minScore = Math.trunc(humanAScore - 1)
        const resultsWithMinScore = await search({ types: 'humans', search: label, lang: 'en', filter: 'inv', minScore })
        const foundIds = _.map(resultsWithMinScore, 'id')
        foundIds.should.containEql(humanA._id)
        foundIds.should.not.containEql(humanB._id)
      })
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

    it('should find a work by its author name', async () => {
      const label = humanName()
      const human = await createHuman({ labels: { en: label } })
      const work = await createWorkWithAuthor(human)
      await waitForIndexation('entities', work._id)
      const results = await search({ types: 'works', search: label, lang: 'en', filter: 'inv' })
      const foundIds = _.map(results, 'id')
      foundIds.should.containEql(work._id)
    })

    it('should find a work by its serie name', async () => {
      const label = randomWords()
      const serie = await createSerie({ labels: { en: label } })
      const work = await createWorkWithSerie(serie)
      await waitForIndexation('entities', work._id)
      const results = await search({ types: 'works', search: label, lang: 'en', filter: 'inv' })
      const foundIds = _.map(results, 'id')
      foundIds.should.containEql(work._id)
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

    it('should find a serie by its author name', async () => {
      const label = humanName()
      const human = await createHuman({ labels: { en: label } })
      const serie = await createSerieWithAuthor({ human })
      await waitForIndexation('entities', serie._id)
      const results = await search({ types: 'series', search: label, lang: 'en', filter: 'inv' })
      const foundIds = _.map(results, 'id')
      foundIds.should.containEql(serie._id)
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

    it('should find a collection by its publisher name', async () => {
      const label = randomWords()
      const publisher = await createPublisher({ labels: { en: label } })
      const collection = await createCollection({
        claims: {
          'wdt:P123': [ publisher.uri ]
        }
      })
      await waitForIndexation('entities', collection._id)
      const results = await search({ types: 'collections', search: label, lang: 'en', filter: 'inv' })
      const foundIds = _.map(results, 'id')
      foundIds.should.containEql(collection._id)
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

  describe('multi-types', () => {
    it('should accept several types', async () => {
      const types = [ 'works', 'series' ]
      const results = await search({ types, search: serie.labels.en, limit: 20 })
      results.forEach(result => types.should.containEql(result.type))
      _.map(results, 'id').includes(serie._id).should.be.true()
    })
  })
})
