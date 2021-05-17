const _ = require('builders/utils')
const { get } = require('lib/requests')
const { wait } = require('lib/promises')
const { host: elasticHost } = require('config').elasticsearch
const { indexesList, syncIndexesList } = require('db/elasticsearch/list')
const createIndex = require('./create_index')
const reindexOnChange = require('./reindex_on_change')

module.exports = async () => {
  await waitForElastic()
  await ensureIndexesExist()
  startCouchElasticSync()
}

const ensureIndexesExist = () => {
  return Promise.all(indexesList.map(ensureIndexExists))
}

const ensureIndexExists = index => {
  const indexUrl = `${elasticHost}/${index}`
  return get(indexUrl)
  .catch(err => {
    if (err.statusCode === 404) return createIndex(index)
    else throw err
  })
}

const waitForElastic = async () => {
  try {
    await get(elasticHost)
  } catch (err) {
    if (err.statusCode === 503 || err.message.includes('ECONNREFUSED')) {
      _.warn(`waiting for Elasticsearch on ${elasticHost}`)
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
