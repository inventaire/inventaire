import should from 'should'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { indexesNamesByBaseNames } from '#db/elasticsearch/indexes'
import { wait } from '#lib/promises'
import config from '#server/config'
import { createHuman, createEdition, addSerie } from '../fixtures/entities.js'
import { deleteByUris, merge, updateLabel } from '../utils/entities.js'
import { getIndexedDoc } from '../utils/search.js'

const { entities: entitiesIndex } = indexesNamesByBaseNames
const { updateDelay: elasticsearchUpdateDelay } = config.elasticsearch

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
    const workUri = claims['wdt:P629'][0]
    // Trigger a reindexation
    await updateLabel({ uri: workUri, lang: 'es', value: 'foo' })
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(entitiesIndex, unprefixify(workUri))
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
    const workUri = claims['wdt:P629'][0]
    const { _id: serieId } = await addSerie(workUri)
    // Trigger a reindexation
    await updateLabel({ uri: serieId, lang: 'es', value: 'foo' })
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
    const result = await getIndexedDoc(entitiesIndex, _id, { retry: false })
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })

  it('should unindex a merged local entity', async () => {
    const { _id, uri } = await createHuman()
    const { uri: otherUri } = await createHuman()
    await wait(elasticsearchUpdateDelay)
    await merge(uri, otherUri)
    await wait(elasticsearchUpdateDelay)
    const result = await getIndexedDoc(entitiesIndex, _id, { retry: false })
    result.found.should.be.false()
    should(result._source).not.be.ok()
  })
})
