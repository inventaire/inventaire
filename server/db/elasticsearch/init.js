import CONFIG from 'config'
import { indexesList, syncIndexesList } from '#db/elasticsearch/indexes'
import { wait } from '#lib/promises'
import { get } from '#lib/requests'
import { warn } from '#lib/utils/logs'
import createIndex from './create_index.js'
import reindexOnChange from './reindex_on_change.js'

const { origin: elasticOrigin } = CONFIG.elasticsearch

export async function waitForElasticsearchInit () {
  await waitForElastic()
  await ensureIndexesExist()
  startCouchElasticSync()
}

const ensureIndexesExist = () => {
  return Promise.all(indexesList.map(ensureIndexExists))
}

const ensureIndexExists = index => {
  const indexUrl = `${elasticOrigin}/${index}`
  return get(indexUrl)
  .catch(err => {
    if (err.statusCode === 404) return createIndex(index)
    else throw err
  })
}

const waitForElastic = async () => {
  try {
    await get(elasticOrigin, { noRetry: true })
  } catch (err) {
    if (err.statusCode === 503 || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      warn(`waiting for Elasticsearch on ${elasticOrigin}`)
      await wait(500)
      return waitForElastic()
    } else {
      throw err
    }
  }
}

const startCouchElasticSync = () => {
  syncIndexesList.forEach(reindexOnChange)
}
