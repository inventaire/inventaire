const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { createWorkWithAuthor } = require('../fixtures/entities')
const { getByUri, merge } = require('../utils/entities')
const { nonAuthReq } = require('../utils/utils')
const { wait } = __.require('lib', 'promises')

const temporarilyCacheRelations = __.require('controllers', 'entities/lib/temporarily_cache_relations')

describe('temporarily cache relations', () => {
  it('should preserve an author relation', async () => {
    const workWithAuthor = await createWorkWithAuthor({ uri: 'wd:Q1345582' })
    const { uri } = workWithAuthor
    const authorUri = workWithAuthor.claims['wdt:P50'][0]
    await temporarilyCacheRelations(uri)
    // Merge with a work entity that doesn't have wdt:P50=wd:Q1345582
    const newWorkUri = 'wd:Q176470'
    await merge(uri, newWorkUri)
    // Give some extra time to CouchDB to update its view
    await wait(500)
    const { works } = await nonAuthReq('get', `/api/entities?action=author-works&uri=${authorUri}`)
    const foundWork = works.find(work => work.uri === newWorkUri)
    const newWork = await getByUri(newWorkUri)
    foundWork.date.should.equal(newWork.claims['wdt:P577'][0])
    foundWork.serie.should.equal(newWork.claims['wdt:P179'][0])
  })
})
