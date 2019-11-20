// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const getThumbData = __.require('data', 'commons/thumb')
const getEnwikiImage = __.require('data', 'wikipedia/image')
const getOpenLibraryCover = __.require('data', 'openlibrary/cover')
const { getAvatarsDataFromClaims } = require('./get_avatars_from_claims')
const getCommonsFilenamesFromClaims = require('./get_commons_filenames_from_claims')

module.exports = entity => {
  return findAnImage(entity)
  .then(data => {
    entity.image = data
    return entity
  })
}

const findAnImage = entity => {
  const commonsFilename = getCommonsFilenamesFromClaims(entity.claims)[0]
  const enwikiTitle = entity.sitelinks.enwiki
  const openLibraryId = entity.claims['wdt:P648'] != null ? entity.claims['wdt:P648'][0] : undefined
  return pickBestPic(entity, commonsFilename, enwikiTitle, openLibraryId)
}

const pickBestPic = (entity, commonsFilename, enwikiTitle, openLibraryId) => {
  return Promise.props({
    wm: getSourcePromise(getThumbData, commonsFilename),
    wp: getSourcePromise(getEnwikiImage, enwikiTitle),
    ol: getSourcePromise(getOpenLibraryCover, openLibraryId, entity.type)
  })
  .then(results => {
    const order = getPicSourceOrder(entity)
    const orderedResults = _.pick(results, order)
    const bestPicData = _.compact(_.values(orderedResults))[0]
    return bestPicData || getAvatarsDataFromClaims(entity.claims)[0]
  })
}

const getSourcePromise = (fn, ...args) => {
  if (args[0] == null) return null

  return fn.apply(null, args)
  .timeout(5000)
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
  const publicationDateClaim = _.get(work, 'claims.wdt:P577.0')
  const publicationYear = publicationDateClaim && publicationDateClaim.split('-')[0]
  if ((publicationYear != null) && (parseInt(publicationYear) < yearsAgo(70))) {
    return [ 'ol', 'wm', 'wp' ]
  } else {
    return [ 'ol', 'wp', 'wm' ]
  }
}

const yearsAgo = years => (new Date().getYear() + 1900) - years
