const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const entities_ = require('../entities')

module.exports = params => entry => {
  const { reqUserId: userId, batchId, forceUpdateProps } = params
  const { edition, works, authors } = entry

  const allResolvedSeeds = [ edition ].concat(works, authors).filter(hasUri)

  return Promise.all(allResolvedSeeds.map(updateEntityFromSeed(userId, batchId, forceUpdateProps)))
  .then(() => entry)
}

const hasUri = seed => seed.uri != null

const updateEntityFromSeed = (userId, batchId, forceUpdateProps) => seed => {
  const { uri, claims: seedClaims } = seed
  if (!uri) return

  const [ prefix, entityId ] = uri.split(':')
  // Do not try to update Wikidata for the moment
  if (prefix === 'wd') return
  getEntity(prefix, entityId)
  .then(updateClaims(seedClaims, userId, batchId, forceUpdateProps))
}

const getEntity = (prefix, entityId) => {
  if (prefix === 'isbn') {
    return entities_.byIsbn(entityId)
  } else {
    return entities_.byId(entityId)
  }
}

const updateClaims = (seedClaims, userId, batchId, forceUpdateProps) => entity => {
  addMissinClaims(seedClaims, userId, batchId, entity)
  // Only update if property exists in forceUpdateProps
  // Known cases: avoid updating authors who are actually edition translators
  if (forceUpdateProps && _.some(forceUpdateProps)) {
    forceUpdateClaims(seedClaims, userId, batchId, forceUpdateProps, entity)
  }
}
const forceUpdateClaims = (seedClaims, userId, batchId, forceUpdateProps, currentDoc) => {
  const updatedDoc = _.cloneDeep(currentDoc)
  const { claims } = updatedDoc
  forceUpdateProps.forEach(prop => {
    if (claims && claims[prop]) {
      claims[prop] = seedClaims[prop]
    }
  })
  if (!_.isEqual(claims, currentDoc.claims)) {
    entities_.putUpdate({ userId, currentDoc, updatedDoc })
  }
}

const addMissinClaims = (seedClaims, userId, batchId, entity) => {
  const newClaims = _.omit(seedClaims, Object.keys(entity.claims))
  if (_.isEmpty(newClaims)) return
  entities_.addClaims(userId, newClaims, entity, batchId)
}
