
const entities_ = require('./entities')
const mergeEntities = require('./merge_entities')
const { unprefixify } = require('./prefix')
const createWdEntity = require('./create_wd_entity')

module.exports = (user, invEntityUri) => {
  const { _id: reqUserId } = user

  const entityId = unprefixify(invEntityUri)

  return entities_.byId(entityId)
  .then(entity => {
    const { labels, claims } = entity
    return createWdEntity({ labels, claims, user, isAlreadyValidated: true })
  })
  .then(createdEntity => {
    const { uri: wdEntityUri } = createdEntity
    return mergeEntities(reqUserId, invEntityUri, wdEntityUri)
    .then(() => ({
      uri: wdEntityUri
    }))
  })
}
