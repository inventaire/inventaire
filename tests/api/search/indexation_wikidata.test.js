const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { wait } = require('lib/promises')
const { getByUri } = require('../utils/entities')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { getIndexedDoc, deindex, indexPlaceholder } = require('../utils/search')
const { wikidata: wikidataIndex } = require('controllers/search/lib/indexes').indexes

describe('indexation:wikidata', () => {
  it('should index a wikidata entity when refreshed', async () => {
    const id = 'Q94973707'
    const uri = `wd:${id}`
    await deindex(wikidataIndex, id)
    await getByUri(uri, true)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(wikidataIndex, id)
    result.found.should.be.true()
    result._source.type.should.equal('work')
  })

  it('should not index a wikidata entity of type meta', async () => {
    const id = 'Q2348445'
    const uri = `wd:${id}`
    await deindex(wikidataIndex, id)
    await getByUri(uri, true)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(wikidataIndex, id)
    result.found.should.be.false()
  })

  it('should not index a wikidata entity of unknown type', async () => {
    const id = 'Q15026'
    const uri = `wd:${id}`
    await deindex(wikidataIndex, id)
    await getByUri(uri, true)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(wikidataIndex, id)
    result.found.should.be.false()
  })

  it('should index the popularity', async () => {
    const id = 'Q94973707'
    const uri = `wd:${id}`
    await deindex(wikidataIndex, id)
    await getByUri(uri, true)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(wikidataIndex, id)
    result.found.should.be.true()
    result._source.popularity.should.a.Number()
  })

  it('should deindex a wikidata entity when redirected', async () => {
    const redirectedEntityId = 'Q105045498'
    await indexPlaceholder(wikidataIndex, redirectedEntityId)
    await getByUri(`wd:${redirectedEntityId}`, true)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(wikidataIndex, redirectedEntityId)
    result.found.should.be.false()
  })

  it('should deindex a wikidata entity when deleted', async () => {
    const deletedEntityId = 'Q6'
    await indexPlaceholder(wikidataIndex, deletedEntityId)
    await getByUri(`wd:${deletedEntityId}`, true)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(wikidataIndex, deletedEntityId)
    result.found.should.be.false()
  })
})
