const _ = require('builders/utils')
const promises_ = require('lib/promises')
const getThumbData = require('data/commons/thumb')
const getEnwikiImage = require('data/wikipedia/image')
const getOpenLibraryCover = require('data/openlibrary/cover')
const getCommonsFilenamesFromClaims = require('./get_commons_filenames_from_claims')

module.exports = async entity => {
  const data = await findAnImage(entity)
  entity.image = data
  return entity
}

const findAnImage = entity => {
  const commonsFilename = getCommonsFilenamesFromClaims(entity.claims)[0]
  const enwikiTitle = entity.sitelinks.enwiki
  const { claims } = entity
  const openLibraryId = claims['wdt:P648'] && claims['wdt:P648'][0]
  return pickBestPic(entity, commonsFilename, enwikiTitle, openLibraryId)
}

const pickBestPic = (entity, commonsFilename, enwikiTitle, openLibraryId) => {
  return promises_.props({
    wm: getThumbData(commonsFilename),
    wp: getSourcePromise(getEnwikiImage, enwikiTitle),
    ol: getSourcePromise(getOpenLibraryCover, openLibraryId, entity.type)
  })
  .then(results => {
    const order = getPicSourceOrder(entity)
    const orderedResults = _.pick(results, order)
    const bestPicData = _.compact(_.values(orderedResults))[0]
    return bestPicData
  })
}

const getSourcePromise = (fn, ...args) => {
  if (args[0] == null) return null

  return fn.apply(null, args)
  // Prevent to throw all the sources
  // eslint-disable-next-line handle-callback-err
  .catch(err => { })
}

const getPicSourceOrder = entity => {
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
const getWorkSourceOrder = work => {
  const { claims } = work
  const publicationDateClaim = claims['wdt:P577'] && claims['wdt:P577'][0]
  const publicationYear = publicationDateClaim && publicationDateClaim.split('-')[0]
  if ((publicationYear != null) && (parseInt(publicationYear) < yearsAgo(70))) {
    return [ 'ol', 'wm', 'wp' ]
  } else {
    return [ 'ol', 'wp', 'wm' ]
  }
}

const yearsAgo = years => (new Date().getYear() + 1900) - years
