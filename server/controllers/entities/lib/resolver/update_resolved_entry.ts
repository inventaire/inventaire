import { cloneDeep, isEqual, omit, pick } from 'lodash-es'
import { normalizeTitle } from '#controllers/entities/lib/resolver/helpers'
import { convertAndCleanupImageUrl } from '#controllers/images/lib/convert_and_cleanup_image_url'
import { getInvEntityByIsbn, getEntityById, putInvEntityUpdate } from '../entities.js'

export default ({ reqUserId, batchId }) => async entry => {
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

function getEntity (prefix, entityId) {
  if (prefix === 'isbn') {
    return getInvEntityByIsbn(entityId)
  } else {
    return getEntityById(entityId)
  }
}

async function updateClaims (entity, seedClaims, imageUrl, reqUserId, batchId) {
  // Do not update if property already exists (except if date is more precise)
  // Known cases: avoid updating authors who are actually edition translators
  const updatedEntity = cloneDeep(entity)
  dropLikelyBadSubtitle({ updatedEntity, seedClaims })
  const newClaims = omit(seedClaims, Object.keys(entity.claims))
  await addImageClaim(entity, imageUrl, newClaims)
  Object.keys(newClaims).forEach(prop => {
    updatedEntity.claims[prop] = newClaims[prop]
  })
  updateDatePrecision(entity, updatedEntity, seedClaims)
  if (isEqual(updatedEntity, entity)) return
  await putInvEntityUpdate({
    userId: reqUserId,
    currentDoc: entity,
    updatedDoc: updatedEntity,
    batchId,
  })
}

function dropLikelyBadSubtitle ({ updatedEntity, seedClaims }) {
  const oldTitle = updatedEntity.claims['wdt:P1476']?.[0]
  const newTitle = seedClaims['wdt:P1476']?.[0]
  const newSubtitle = seedClaims['wdt:P1680']?.[0]
  if (oldTitle && newSubtitle) {
    if (normalizeTitle(newTitle) === normalizeTitle(oldTitle)) {
      if (normalizeTitle(newSubtitle).includes(normalizeTitle(oldTitle))) {
        // Avoid adding a subtitle already present in the title
        delete seedClaims['wdt:P1680']
      }
    } else {
      // Only attempt to edit the subtitle if the old and the new title match
      delete seedClaims['wdt:P1680']
    }
  }
}

async function addImageClaim (entity, imageUrl, newClaims) {
  if (!imageUrl) return
  const imageClaims = entity.claims['invp:P2']
  if (imageClaims) return
  const { hash: imageHash } = await convertAndCleanupImageUrl({ url: imageUrl, container: 'entities' })
  if (imageHash) newClaims['invp:P2'] = [ imageHash ]
}

function updateDatePrecision (entity, updatedEntity, seedClaims) {
  const seedDateClaims = pick(seedClaims, simpleDayProperties)
  Object.keys(seedDateClaims).forEach(prop => {
    const seedDate = seedDateClaims[prop][0]
    if (!seedDate) return
    const currentDate = entity.claims[prop] && entity.claims[prop][0]
    if (currentDate) {
      if (isMorePreciseDate(seedDate, currentDate) && doDatesAgree(seedDate, currentDate)) {
        updatedEntity.claims[prop] = seedDateClaims[prop]
      }
    } else {
      updatedEntity.claims[prop] = seedDateClaims[prop]
    }
  })
}

const simpleDayProperties = [ 'wdt:P569', 'wdt:P570', 'wdt:P571', 'wdt:P576', 'wdt:P577' ]

const doDatesAgree = (seedDate, currentDate) => seedDate.startsWith(currentDate)

const isMorePreciseDate = (date1, date2) => dateParts(date1).length > dateParts(date2).length

const dateParts = simpleDay => simpleDay.split('-')
