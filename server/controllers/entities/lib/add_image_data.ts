import { compact, pick } from 'lodash-es'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { getWikimediaThumbnailData } from '#data/commons/thumb'
// import getOpenLibraryCover from '#data/openlibrary/cover'
// import getEnwikiImage from '#data/wikipedia/image'
import { objectPromise } from '#lib/promises'
// import { logError } from '#lib/utils/logs'
import type { SerializedWdEntity, WikimediaCommonsFilename } from '#server/types/entity'
import type { ImageData } from '#server/types/image'
import { getCommonsFilenamesFromClaims } from './get_commons_filenames_from_claims.js'
import type { SetOptional } from 'type-fest'

type SerializedWdEntityPreImage = SetOptional<SerializedWdEntity, 'image'>
export async function addImageData (entity: SerializedWdEntityPreImage) {
  const data: ImageData = await findAnImage(entity)
  entity.image = data
  return entity
}

async function findAnImage (entity: SerializedWdEntityPreImage) {
  const commonsFilename = getCommonsFilenamesFromClaims(entity.claims)[0]
  const enwikiTitle = entity.sitelinks.enwiki?.title
  const { claims } = entity
  const openLibraryId = getFirstClaimValue(claims, 'wdt:P648')
  const bestPicData = await pickBestPic(entity, commonsFilename, enwikiTitle, openLibraryId)
  if (bestPicData) return bestPicData
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function pickBestPic (entity: SerializedWdEntityPreImage, commonsFilename: WikimediaCommonsFilename, enwikiTitle?: string, openLibraryId?: string) {
  return objectPromise({
    wm: getWikimediaThumbnailData(commonsFilename),
    // Disabled as requests to en.wikipedia.org and archive.org are often very slow to respond
    // when queries en masse
    // TODO: re-enable with rate limiting (with `async-sema` package?)
    // wp: getSourcePromise('enwiki', getEnwikiImage, enwikiTitle),
    // ol: getSourcePromise('openlibrary', getOpenLibraryCover, openLibraryId, entity.type),
  })
  .then(results => {
    const order = getPicSourceOrder(entity)
    const orderedResults = pick(results, order)
    const bestPicData = compact(Object.values(orderedResults))[0]
    return bestPicData
  })
}

// function getSourcePromise (sourceName, fn, ...args) {
//   if (args[0] == null) return null

//   return fn.apply(null, args)
//   .catch(err => {
//     err.context = err.context || {}
//     err.context.args = args
//     // Do not rethrow the error to let a chance to other sources
//     logError(err, `${sourceName} image not found`)
//   })
// }

function getPicSourceOrder (entity: SerializedWdEntityPreImage) {
  const { type } = entity
  // Commons pictures are prefered to Wikipedia and Open Library
  // to get access to photo credits
  if (type === 'human') return [ 'wm', 'wp', 'ol' ]
  else if (type === 'work') return getWorkSourceOrder(entity)
  else return [ 'wm', 'wp' ]
}

// Giving priority to openlibrary's pictures for works
// as it has only covers while commons sometimes has just an illustration
// Give priority to Wikimedia over Wikipedia for works
// likely to be in the public domain and have a good image set in Wikidata
// while querying images from English Wikipedia articles
// can give quite random results
function getWorkSourceOrder (work: SerializedWdEntityPreImage) {
  const { claims } = work
  const publicationDateClaim = getFirstClaimValue(claims, 'wdt:P577')
  const publicationYear = publicationDateClaim && publicationDateClaim.split('-')[0]
  if ((publicationYear != null) && (parseInt(publicationYear) < yearsAgo(70))) {
    return [ 'ol', 'wm', 'wp' ]
  } else {
    return [ 'ol', 'wp', 'wm' ]
  }
}

const yearsAgo = (years: number) => (new Date().getFullYear()) - years
