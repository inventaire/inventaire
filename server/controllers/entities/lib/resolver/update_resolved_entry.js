const _ = require('builders/utils')
const entities_ = require('../entities')
const { getImageByUrl } = require('data/dataseed/dataseed')

module.exports = ({ reqUserId, batchId }) => async entry => {
  const { edition, works, authors } = entry

  const allResolvedSeeds = [ edition ].concat(works, authors).filter(hasUri)

  await Promise.all(allResolvedSeeds.map(updateEntityFromSeed(reqUserId, batchId)))
  return entry
}

const hasUri = seed => seed.uri != null

const updateEntityFromSeed = (reqUserId, batchId) => async seed => {
  const { uri, claims: seedClaims, image: imageUrl } = seed
  if (!uri) return

  const [ prefix, entityId ] = uri.split(':')
  // Do not try to update Wikidata for the moment
  if (prefix === 'wd') return

  const entity = await getEntity(prefix, entityId)
  await addMissingClaims(entity, seedClaims, imageUrl, reqUserId, batchId)
}

const getEntity = (prefix, entityId) => {
  if (prefix === 'isbn') {
    return entities_.byIsbn(entityId)
  } else {
    return entities_.byId(entityId)
  }
}

const addMissingClaims = async (entity, seedClaims, imageUrl, reqUserId, batchId) => {
  // Do not update if property already exists
  // Known cases: avoid updating authors who are actually edition translators
  const newClaims = _.omit(seedClaims, Object.keys(entity.claims))
  await addImageClaim(entity, imageUrl, newClaims)
  if (_.isEmpty(newClaims)) return
  return entities_.addClaims(reqUserId, newClaims, entity, batchId)
}

const addImageClaim = async (entity, imageUrl, newClaims) => {
  if (!imageUrl) return
  const imageClaims = entity.claims['invp:P2']
  if (imageClaims) return
  const { url: imageHash } = await getImageByUrl(imageUrl)
  newClaims['invp:P2'] = [ imageHash ]
}
