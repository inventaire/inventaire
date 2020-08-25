const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const entities_ = require('./entities')
const mergeEntities = require('./merge_entities')
const { unprefixify } = require('./prefix')
const createWdEntity = require('./create_wd_entity')

module.exports = async (user, invEntityUri) => {
  const { _id: reqUserId } = user

  const entityId = unprefixify(invEntityUri)

  const entity = await entities_.byId(entityId).catch(rewrite404(invEntityUri))

  const { labels, claims } = entity
  const { uri: wdEntityUri } = await createWdEntity({ labels, claims, user, isAlreadyValidated: true })

  await mergeEntities(reqUserId, invEntityUri, wdEntityUri)

  return { uri: wdEntityUri }
}

const rewrite404 = invEntityUri => err => {
  if (err.statusCode === 404) {
    throw error_.new('entity not found', 400, { invEntityUri })
  } else {
    throw err
  }
}
