const CONFIG = require('config')
const should = require('should')
const { wait } = require('lib/promises')
const { createHuman, createEdition, addSerie } = require('../fixtures/entities')
const { deleteByUris, merge, updateLabel } = require('../utils/entities')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const { getIndexedDoc } = require('../utils/search')
const { entities: entitiesIndex } = require('controllers/search/lib/indexes').indexes

describe('indexation:entities', () => {
  it('should index a new local entity', async () => {
    const { _id } = await createHuman()
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(entitiesIndex, _id)
    result.found.should.be.true()
    result._source.labels.should.be.an.Object()
    result._source.type.should.equal('human')
  })

  it('should index a work with its editions images per lang', async () => {
    const lang = 'nl'
    // Creates a work, then an edition linking to that work
    // so the edition wasn't accessible when the work was indexed
    // so we will need to trigger a reindexation later to get access
    // to the edition data
    const { claims } = await createEdition({ lang })
    const editionImageHash = claims['invp:P2'][0]
    const workId = claims['wdt:P629'][0].split(':')[1]
    // Trigger a reindexation
    await updateLabel(workId, 'es', 'foo')
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(entitiesIndex, workId)
    result._source.images[lang][0].should.equal(editionImageHash)
  })

  it('should index a serie with its works editions images per lang', async () => {
    const lang = 'nl'
    // Creates a work, then an edition linking to that work
    // so the edition wasn't accessible when the work was indexed
    // so we will need to trigger a reindexation later to get access
    // to the edition data
    const { claims } = await createEdition({ lang })
    const editionImageHash = claims['invp:P2'][0]
    const workUi = claims['wdt:P629'][0].split(':')[1]
    const { _id: serieId } = await addSerie(workUi)
    // Trigger a reindexation
    await updateLabel(serieId, 'es', 'foo')
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(entitiesIndex, serieId)
    result._source.images[lang][0].should.equal(editionImageHash)
  })

  it('should index the entity popularity', async () => {
    const { _id } = await createHuman()
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(entitiesIndex, _id)
    result.found.should.be.true()
    result._source.labels.should.be.an.Object()
    result._source.type.should.equal('human')
    result._source.popularity.should.a.Number()
  })
})

describe('deindexation:entities', () => {
  it('should unindex a deleted local entity', async () => {
    const { _id, uri } = await createHuman()
    await wait(elasticsearchUpdateDelay)
    await deleteByUris(uri)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(entitiesIndex, _id)
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })

  it('should unindex a merged local entity', async () => {
    const { _id, uri } = await createHuman()
    const { uri: otherUri } = await createHuman()
    await wait(elasticsearchUpdateDelay)
    await merge(uri, otherUri)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(entitiesIndex, _id)
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })
})
