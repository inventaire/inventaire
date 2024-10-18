import 'should'
import entitiesRelationsTemporaryCache from '#controllers/entities/lib/entities_relations_temporary_cache'
import { runWdQuery } from '#data/wikidata/run_query'
import { someFakeUri } from '#fixtures/entities'
import { catchNotFound } from '#lib/error/error'
import { wait } from '#lib/promises'
import config from '#server/config'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const { get, set, del } = entitiesRelationsTemporaryCache
const { checkFrequency, ttl } = config.entitiesRelationsTemporaryCache

const property = 'wdt:P50'
const targetEntityUri = 'wd:Q1'

describe('entities relations temporary cache', () => {
  beforeEach(async () => {
    await del(someFakeUri, property, targetEntityUri).catch(catchNotFound)
  })

  it('should reject missing subject', async () => {
    try {
      await set(null, property, targetEntityUri)
      shouldNotBeCalled()
    } catch (err) {
      err.message.should.equal('invalid subject')
    }
  })

  it('should reject missing property', async () => {
    try {
      await set(someFakeUri, null, targetEntityUri)
      shouldNotBeCalled()
    } catch (err) {
      err.message.should.equal('invalid property')
    }
  })

  it('should reject missing value', async () => {
    try {
      await set(someFakeUri, property, null)
      shouldNotBeCalled()
    } catch (err) {
      err.message.should.equal('invalid value')
    }
  })

  it('should store a relation', async () => {
    await set(someFakeUri, property, targetEntityUri)
    const subjects = await get(property, targetEntityUri)
    subjects.should.containEql(someFakeUri)
  })

  it('should delete a relation after the ttl expired', async function () {
    const delay = ttl + checkFrequency
    this.timeout(5000 + delay)
    await set(someFakeUri, property, targetEntityUri)
    const subjects = await get(property, targetEntityUri)
    subjects.should.containEql(someFakeUri)
    await wait(delay)
    const refreshedSubjects = await get(property, targetEntityUri)
    refreshedSubjects.should.not.containEql(someFakeUri)
  })

  it('should invalidate related cached queries', async function () {
    const delay = ttl + checkFrequency
    this.timeout(10000 + delay)
    const authorId = 'Q1345582'
    const authorUri = `wd:${authorId}`
    const works = await runWdQuery({ query: 'author_works', qid: authorId })
    works.length.should.be.above(0)
    await set(someFakeUri, 'wdt:P50', authorUri)
    await wait(delay)
    // Using dry=true so that we just get an empty result
    // if the cache invalidation worked as expected
    const worksInCache = await runWdQuery({ query: 'author_works', qid: authorId, dry: true })
    worksInCache.length.should.equal(0)
  })
})
