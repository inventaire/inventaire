const _ = require('builders/utils')
require('should')
const { createHuman, createWorkWithAuthor } = require('../fixtures/entities')
const { shouldNotBeCalled } = require('../utils/utils')
const { search, waitForIndexation } = require('../utils/search')
const { getByUris } = require('../utils/entities')
const someOtherAuthorUri = 'inv:00000000000000000000000000000000'
const wikidataUris = [ 'wd:Q1345582', 'wd:Q18120925' ]

describe('search:entities:by-claim', async () => {
  let workAuthor, workWithAuthor
  before(async () => {
    workAuthor = await createHuman()
    workWithAuthor = await createWorkWithAuthor(workAuthor)
    await Promise.all([
      waitForIndexation('entities', workWithAuthor._id),
      // Ensure wikidata uris are indexed in the current format
      getByUris(wikidataUris, null, true),
      // and wait for them to be indexed
      ...wikidataUris.map(uri => waitForIndexation('wikidata', uri.split(':')[1])),
    ])
  })

  it('should reject unknown properties', async () => {
    await search({ types: 'works', claim: 'wdt:P6=wd:Q535' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('unknown property')
    })
  })

  it('should reject invalid property values', async () => {
    await search({ types: 'works', claim: 'wdt:P123=456' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('invalid property value')
    })
  })

  it('should find a local entity by one of its relation claims', async () => {
    const results = await search({ types: 'works', claim: `wdt:P50=${workAuthor.uri}`, lang: 'en', filter: 'inv' })
    const foundIds = _.map(results, 'id')
    foundIds.should.containEql(workWithAuthor._id)
  })

  it('should find a wikidata entity by one of its relation claims', async () => {
    const results = await search({ types: 'works', claim: 'wdt:P50=wd:Q1345582', filter: 'wd' })
    const foundIds = _.map(results, 'id')
    foundIds.should.containEql('Q18120925')
  })

  it('should accept OR conditions', async () => {
    const results = await search({ types: 'works', claim: `wdt:P50=${workAuthor.uri}|wdt:P50=${someOtherAuthorUri}`, lang: 'en', filter: 'inv' })
    const foundIds = _.map(results, 'id')
    foundIds.should.containEql(workWithAuthor._id)
  })

  it('should accept AND conditions', async () => {
    const results = await search({ types: 'works', claim: `wdt:P31=wd:Q47461344 wdt:P50=${workAuthor.uri}`, lang: 'en', filter: 'inv' })
    const foundIds = _.map(results, 'id')
    foundIds.should.containEql(workWithAuthor._id)
    const results2 = await search({ types: 'works', claim: `wdt:P31=wd:Q2831984 wdt:P50=${workAuthor.uri}`, lang: 'en', filter: 'inv' })
    const foundIds2 = _.map(results2, 'id')
    foundIds2.should.not.containEql(workWithAuthor._id)
  })

  it('should accept a combination of AND and OR conditions', async () => {
    const results = await search({ types: 'works', claim: `wdt:P31=wd:Q47461344 wdt:P50=${workAuthor.uri}|wdt:P50=${someOtherAuthorUri}`, lang: 'en', filter: 'inv' })
    const foundIds = _.map(results, 'id')
    foundIds.should.containEql(workWithAuthor._id)
  })

  it('should accept a claim and a search', async () => {
    const anotherWorkWithThatSameAuthor = await createWorkWithAuthor(workAuthor)
    await waitForIndexation('entities', anotherWorkWithThatSameAuthor._id)
    const workLabel = workWithAuthor.labels.en
    const resultsWithOnlyClaimFilter = await search({ types: 'works', claim: `wdt:P50=${workAuthor.uri}`, lang: 'en', filter: 'inv' })
    const foundIdsA = _.map(resultsWithOnlyClaimFilter, 'id')
    foundIdsA.should.containEql(workWithAuthor._id)
    foundIdsA.should.containEql(anotherWorkWithThatSameAuthor._id)
    const resultsWithClaimFilterAndSearch = await search({ types: 'works', claim: `wdt:P50=${workAuthor.uri}`, search: workLabel, exact: true, lang: 'en', filter: 'inv' })
    const foundIdsB = _.map(resultsWithClaimFilterAndSearch, 'id')
    foundIdsB.should.containEql(workWithAuthor._id)
    foundIdsB.should.not.containEql(anotherWorkWithThatSameAuthor._id)
  })
})
