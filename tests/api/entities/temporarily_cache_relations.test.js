import CONFIG from 'config'
import _ from 'lodash-es'
import 'should'
import { wait } from '#lib/promises'
import { cacheEntityRelations, getCachedRelations } from '#controllers/entities/lib/temporarily_cache_relations'
import { createWorkWithAuthor, createWorkWithSerie } from '../fixtures/entities.js'
import { merge } from '../utils/entities.js'
import { publicReq } from '../utils/utils.js'

// We are calling directly cacheEntityRelations, as the cases that use it would require to edit Wikidata,
// so the following tests try to reproduce conditions as close as possible to the real use-cases

if (CONFIG.leveldbMemoryBackend) {
  throw new Error(`this test requires ${CONFIG.env} config to have CONFIG.leveldbMemoryBackend=false`)
}

// Due to this feature being primarily used to keep data after edits on Wikidata,
// and due to the revalidation on primary data, it's quite hard to test from the API itself.
describe('temporarily cache relations', () => {
  it('should add author relation to cache', async () => {
    const someAuthorUri = 'wd:Q1345582'
    const { uri } = await createWorkWithAuthor({ uri: someAuthorUri })
    await cacheEntityRelations(uri)
    const cachedRelationsEntity = await getCachedRelations(someAuthorUri, 'wdt:P50', _.identity)
    _.map(cachedRelationsEntity, 'uri').should.containEql(uri)
  })

  it('should add serie relation to cache', async () => {
    const someSerieUri = 'wd:Q3656893'
    const { uri } = await createWorkWithSerie({ uri: someSerieUri })
    await cacheEntityRelations(uri)
    const cachedRelationsEntity = await getCachedRelations(someSerieUri, 'wdt:P179', _.identity)
    _.map(cachedRelationsEntity, 'uri').should.containEql(uri)
  })

  it('should check the primary data', async () => {
    const someSerieUri = 'wd:Q3656893'
    const someUnrelatedWorkUri = 'wd:Q187655'
    const workWithSerie = await createWorkWithSerie({ uri: someSerieUri })
    const { uri } = workWithSerie
    const serieUri = workWithSerie.claims['wdt:P179'][0]
    await cacheEntityRelations(uri)
    // Merge with a work entity that doesn't have wdt:P179=wd:Q3656893
    await merge(uri, someUnrelatedWorkUri)
    // Give some extra time to CouchDB to update its view
    await wait(500)
    const { parts } = await publicReq('get', `/api/entities?action=serie-parts&uri=${serieUri}`)
    const matchingWorks = parts.filter(work => work.uri === someUnrelatedWorkUri)
    // No matchingWorks should be found as the real entity, which is the primary data,
    // doesn't have the corresponding claim
    matchingWorks.length.should.equal(0)
  })
})
