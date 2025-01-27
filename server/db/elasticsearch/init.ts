import { indexesList, syncIndexesList } from '#db/elasticsearch/indexes'
import { elasticReqOptions } from '#lib/elasticsearch'
import { newError } from '#lib/error/error'
import { wait } from '#lib/promises'
import { get } from '#lib/requests'
import { warn } from '#lib/utils/logs'
import config from '#server/config'
import type { AbsoluteUrl, RelativeUrl } from '#types/common'
import createIndex from './create_index.js'
import reindexOnChange from './reindex_on_change.js'

const { origin: elasticOrigin } = config.elasticsearch

async function _waitForElasticsearchInit () {
  await waitForElastic()
  await ensureIndexesExist()
  startCouchElasticSync()
  await waitForElastic('/_doc/wikidata/test', { expectedStatusCode: 404 })
}

let promise
export async function waitForElasticsearchInit () {
  promise = promise || _waitForElasticsearchInit()
  return promise
}

function ensureIndexesExist () {
  return Promise.all(indexesList.map(ensureIndexExists))
}

function ensureIndexExists (index) {
  const indexUrl = `${elasticOrigin}/${index}` as AbsoluteUrl
  return get(indexUrl, elasticReqOptions)
  .catch(err => {
    if (err.statusCode === 404) return createIndex(index)
    else throw err
  })
}

interface WaitForElasticOptions {
  expectedStatusCode?: number
}

async function waitForElastic (path: RelativeUrl = '/', options: WaitForElasticOptions = {}) {
  try {
    const url = elasticOrigin + path as AbsoluteUrl
    await get(url, { noRetry: true, ...elasticReqOptions })
  } catch (err) {
    if (err.statusCode === 503 || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      warn(`waiting for Elasticsearch on ${elasticOrigin}`)
      await wait(500)
      return waitForElastic(path, options)
    } else if (!(options.expectedStatusCode && err.statusCode === options.expectedStatusCode)) {
      const localErr = newError('failed to connect to Elasticsearch', 500, { path, options, elasticReqOptions })
      localErr.cause = err
      throw localErr
    }
  }
}

function startCouchElasticSync () {
  syncIndexesList.forEach(reindexOnChange)
}
