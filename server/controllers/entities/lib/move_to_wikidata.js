const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const entities_ = require('./entities')
const mergeEntities = require('./merge_entities')
const { cacheEntityRelations } = require('./temporarily_cache_relations')
const { unprefixify } = require('./prefix')
const createWdEntity = require('./create_wd_entity')

module.exports = async (user, invEntityUri) => {
  const { _id: reqUserId } = user

  const entityId = unprefixify(invEntityUri)

  const entity = await entities_.byId(entityId).catch(rewrite404(invEntityUri))

  const { labels, claims } = entity
  const { uri: wdEntityUri } = await createWdEntity({ labels, claims, user, isAlreadyValidated: true })

  // Caching relations for some hours, as Wikidata Query Service can take some time to update,
  // at the very minimum some minutes, during which the data contributor might be confused
  // by the absence of the entity they just moved to Wikidata in lists generated with the help of the WQS
  await cacheEntityRelations(invEntityUri)

  await mergeEntities({
    userId: reqUserId,
    fromUri: invEntityUri,
    toUri: wdEntityUri,
    context: {
      action: 'move-to-wikidata'
    }
  })

  return { uri: wdEntityUri }
}

const rewrite404 = invEntityUri => err => {
  if (err.statusCode === 404) {
    throw error_.new('entity not found', 400, { invEntityUri })
  } else {
    throw err
  }
}
