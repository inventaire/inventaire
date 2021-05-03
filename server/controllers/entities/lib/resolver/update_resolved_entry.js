const _ = require('builders/utils')
const entities_ = require('../entities')
const convertAndCleanupImageUrl = require('controllers/images/lib/convert_and_cleanup_image_url')

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
  await updateClaims(entity, seedClaims, imageUrl, reqUserId, batchId)
}

const getEntity = (prefix, entityId) => {
  if (prefix === 'isbn') {
    return entities_.byIsbn(entityId)
  } else {
    return entities_.byId(entityId)
  }
}

const updateClaims = async (entity, seedClaims, imageUrl, reqUserId, batchId) => {
  // Do not update if property already exists (except if date is more precise)
  // Known cases: avoid updating authors who are actually edition translators
  const updatedEntity = _.cloneDeep(entity)
  const newClaims = _.omit(seedClaims, Object.keys(entity.claims))
  Object.keys(newClaims).forEach(prop => {
    updatedEntity.claims[prop] = newClaims[prop]
  })
  updateDatePrecision(entity, updatedEntity, seedClaims)
  await addImageClaim(entity, imageUrl, newClaims)
  if (_.isEqual(updatedEntity, entity)) return
  await entities_.putUpdate({
    userId: reqUserId,
    currentDoc: entity,
    updatedDoc: updatedEntity,
    batchId
  })
}

const addImageClaim = async (entity, imageUrl, newClaims) => {
  if (!imageUrl) return
  const imageClaims = entity.claims['invp:P2']
  if (imageClaims) return
  const { hash: imageHash } = await convertAndCleanupImageUrl(imageUrl)
  newClaims['invp:P2'] = [ imageHash ]
}

const updateDatePrecision = (entity, updatedEntity, seedClaims) => {
  const seedDateClaims = _.pick(seedClaims, simpleDayProperties)
  Object.keys(seedDateClaims).forEach(prop => {
    const seedDates = seedDateClaims[prop]
    const seedDate = seedDates[0]
    const currentDate = entity.claims[prop][0]
    if (seedDate && currentDate && isMorePreciseDate(seedDate, currentDate) && doDatesAgree(seedDate, currentDate)) {
      updatedEntity.claims[prop] = seedDateClaims[prop]
    }
  })
}

const simpleDayProperties = [ 'wdt:P569', 'wdt:P570', 'wdt:P571', 'wdt:P576', 'wdt:P577' ]

const doDatesAgree = (seedDate, currentDate) => seedDate.startsWith(currentDate)

const isMorePreciseDate = (date1, date2) => dateParts(date1).length > dateParts(date2).length

const dateParts = simpleDay => simpleDay.split('-')
