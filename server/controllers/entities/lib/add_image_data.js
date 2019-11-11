// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
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

module.exports = entity => findAnImage(entity)
.then((data) => {
  entity.image = data
  return entity
})

var findAnImage = function(entity){
  const commonsFilename = getCommonsFilenamesFromClaims(entity.claims)[0]
  const enwikiTitle = entity.sitelinks.enwiki
  const openLibraryId = entity.claims['wdt:P648'] != null ? entity.claims['wdt:P648'][0] : undefined
  return pickBestPic(entity, commonsFilename, enwikiTitle, openLibraryId)
}

var pickBestPic = (entity, commonsFilename, enwikiTitle, openLibraryId) => Promise.props({
  wm: getSourcePromise(getThumbData, commonsFilename),
  wp: getSourcePromise(getEnwikiImage, enwikiTitle),
  ol: getSourcePromise(getOpenLibraryCover, openLibraryId, entity.type) }).then((results) => {
  const order = getPicSourceOrder(entity)
  const orderedResults = _.pick(results, order)
  const bestPicData = _.compact(_.values(orderedResults))[0]
  return bestPicData || getAvatarsDataFromClaims(entity.claims)[0]})

var getSourcePromise = function(fn, ...args){
  if (args[0] == null) { return null }

  return fn.apply(null, args)
  .timeout(5000)
  // Prevent to throw all the sources
  .catch((err) => {  })
}

var getPicSourceOrder = function(entity){
  const { type } = entity
  switch (type) {
  // Commons pictures are prefered to Wikipedia and Open Library
  // to get access to photo credits
  case 'human': return [ 'wm', 'wp', 'ol' ]
  case 'work':
    // Giving priority to openlibrary's pictures for works
    // as it has only covers while commons sometimes has just an illustration
    // Give priority to Wikimedia over Wikipedia for works
    // likely to be in the public domain and have a good image set in Wikidata
    // while querying images from English Wikipedia articles
    // can give quite random results
    var publicationYear = __guard__(entity.claims['wdt:P577'] != null ? entity.claims['wdt:P577'][0] : undefined, x => x.split('-')[0])
    if ((publicationYear != null) && (parseInt(publicationYear) < yearsAgo(70))) {
      return [ 'ol', 'wm', 'wp' ]
    } else {
      return [ 'ol', 'wp', 'wm' ]
    }

  default:
    return [ 'wm', 'wp' ]
  }
}

var yearsAgo = years => (new Date().getYear() + 1900) - years

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}