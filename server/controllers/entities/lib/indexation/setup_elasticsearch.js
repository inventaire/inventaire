const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { get, put } = __.require('lib', 'requests')
const { wait } = __.require('lib', 'promises')
const { host: elasticHost } = CONFIG.elasticsearch
const { indexes } = CONFIG.entitiesSearchEngine
if (!indexes.inventaire) throw new Error('Missing config indexes.inventaire')
const invIndexUri = `${elasticHost}/${indexes.inventaire}`

const setupElasticSearch = () => {
  return get(elasticHost)
  .then(ensureElasticInvIndex)
  .catch(waitForElastic)
}

const ensureElasticInvIndex = () => {
  return get(invIndexUri)
  .then(() => { _.info(`${invIndexUri} already exists`) })
  .catch(err => {
    if (err.statusCode === 404) return createIndex(invIndexUri)
    else throw err
  })
}

const createIndex = uri => {
  _.info(`creating ${uri}`)
  return put(uri)
  .catch(_.ErrorRethrow(`failed to create ${invIndexUri}`))
}

const waitForElastic = async err => {
  if (err.statusCode === 503 || err.message.includes('ECONNREFUSED')) {
    _.warn(`waiting for ElasticSearch on ${elasticHost}`)
    await wait(500)
    return setupElasticSearch
  } else {
    throw err
  }
}

module.exports = setupElasticSearch
