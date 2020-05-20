const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const entities_ = require('./entities')
const mergeEntities = require('./merge_entities')
const { unprefixify } = require('./prefix')
const createWdEntity = require('./create_wd_entity')
const { types } = __.require('lib', 'wikidata/aliases')

module.exports = (user, invEntityUri, asP31value) => {
  const { _id: reqUserId } = user

  const entityId = unprefixify(invEntityUri)
  return entities_.byId(entityId)
  .catch(err => {
    if (err.statusCode === 404) {
      throw error_.new('entity not found', 400, { invEntityUri })
    }
  })
  .then(entity => {
    const { labels, claims } = entity
    rewriteP31(claims, asP31value)
    return createWdEntity({ labels, claims, user, isAlreadyValidated: true })
  })
  .then(createdEntity => {
    const { uri: wdEntityUri } = createdEntity
    return mergeEntities(reqUserId, invEntityUri, wdEntityUri)
    .then(() => ({ uri: wdEntityUri }))
  })
}

const rewriteP31 = (claims, asP31value) => {
  if (asP31value && types[asP31value]) {
    claims['wdt:P31'] = [ asP31value ]
  }
}
