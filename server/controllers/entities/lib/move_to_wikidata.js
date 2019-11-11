// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const entities_ = require('./entities')
const mergeEntities = require('./merge_entities')
const { unprefixify } = require('./prefix')
const createWdEntity = require('./create_wd_entity')

module.exports = function(user, invEntityUri){
  const { _id: reqUserId } = user

  const entityId = unprefixify(invEntityUri)

  return entities_.byId(entityId)
  .then((entity) => {
    const { labels, claims } = entity
    return createWdEntity({ labels, claims, user, isAlreadyValidated: true })})
  .then((createdEntity) => {
    const { uri: wdEntityUri } = createdEntity
    return mergeEntities(reqUserId, invEntityUri, wdEntityUri)
    .then(() => ({
      uri: wdEntityUri
    }))})
}
