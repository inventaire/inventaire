const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { wait } = __.require('lib', 'promises')
const { getByUri } = require('../utils/entities')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { getIndexedDoc, deindex } = require('../utils/search')
const { wikidata: wikidataIndex } = __.require('controllers', 'search/lib/indexes').indexes

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

  // it('should deindex a wikidata entity when deleted', async () => {})
  // it('should deindex a wikidata entity when redirected', async () => {})
})
