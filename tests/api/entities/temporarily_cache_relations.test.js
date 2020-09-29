const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { createWorkWithAuthor, createWorkWithSerie } = require('../fixtures/entities')
const { getByUri, merge } = require('../utils/entities')
const { publicReq } = require('../utils/utils')
const { wait } = __.require('lib', 'promises')

// We are calling directly cacheEntityRelations, as the cases that use it would require to edit Wikidata,
// so the following tests try to reproduce conditions as close as possible to the real use-cases
const { cacheEntityRelations } = __.require('controllers', 'entities/lib/temporarily_cache_relations')

const assertLeveldbDiskBackend = () => {
  if (CONFIG.leveldbMemoryBackend) {
    throw new Error(`this test requires ${CONFIG.env} config to have CONFIG.leveldbMemoryBackend=false`)
  }
}

describe('temporarily cache relations', () => {
  // Test dependency: CONFIG.leveldbMemoryBackend=false
  xit('should preserve an author relation', async () => {
    assertLeveldbDiskBackend()
    const someAuthorUri = 'wd:Q1345582'
    const someUnrelatedWorkUri = 'wd:Q176470'
    const workWithAuthor = await createWorkWithAuthor({ uri: someAuthorUri })
    const { uri } = workWithAuthor
    const authorUri = workWithAuthor.claims['wdt:P50'][0]
    await cacheEntityRelations(uri)
    // Merge with a work entity that doesn't have wdt:P50=wd:Q1345582
    await merge(uri, someUnrelatedWorkUri)
    // Give some extra time to CouchDB to update its view
    await wait(500)
    const { works } = await publicReq('get', `/api/entities?action=author-works&uri=${authorUri}`)
    const matchingWorks = works.filter(work => work.uri === someUnrelatedWorkUri)
    matchingWorks.length.should.equal(1)
    const foundWork = matchingWorks[0]
    const newWork = await getByUri(someUnrelatedWorkUri)
    foundWork.date.should.equal(newWork.claims['wdt:P577'][0])
    foundWork.serie.should.equal(newWork.claims['wdt:P179'][0])
  })

  // Test dependency: CONFIG.leveldbMemoryBackend=false
  xit('should preserve a serie relation', async () => {
    assertLeveldbDiskBackend()
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
    matchingWorks.length.should.equal(1)
    const foundWork = matchingWorks[0]
    const newWork = await getByUri(someUnrelatedWorkUri)
    foundWork.date.should.equal(newWork.claims['wdt:P577'][0])
    // It's is likely that, due to the preference for P1545 as qualifiers on Wikidata,
    // this assertion will fail at some point in the future, thus the 'if'
    if (newWork.claims['wdt:P1545'][0]) {
      foundWork.ordinal.should.equal(newWork.claims['wdt:P1545'][0])
    }
  })
})
