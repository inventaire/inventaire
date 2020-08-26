const entities_ = require('./entities')
const { unprefixify } = require('./prefix')
const entitiesRelationsTemporaryCache = require('./entities_relations_temporary_cache')
const relationProperties = [
  'wdt:P50',
  'wdt:P179'
]

module.exports = async invEntityUri => {
  const id = unprefixify(invEntityUri)

  const { claims } = await entities_.byId(id)
  const promises = []

  for (const property of relationProperties) {
    if (claims[property]) {
      for (const value of claims[property]) {
        console.log({ invEntityUri, property, value })
        const promise = entitiesRelationsTemporaryCache.set(invEntityUri, property, value)
        promises.push(promise)
      }
    }
  }

  return Promise.all(promises)
}
