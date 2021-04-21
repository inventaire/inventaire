// A module to put the basis of an edition entity based on the results
// from dataseed. It assumes that any seed arriving here found no match to its ISBN
// thus that a new edition entity is needed, for which we need to find a work.
// This last task, and the effort of reconciling with the existing entities
// is let to the responsability of the ./work module

const _ = require('builders/utils')
const error_ = require('lib/error/error')
const { parse: parseIsbn } = require('lib/isbn/isbn')
const properties = require('../properties/properties_values_constraints')
const createInvEntity = require('../create_inv_entity')
// It is simpler to use a consistent, recognizable mocked user id
// than to put exceptions everywhere
const seedUserId = require('db/couchdb/hard_coded_documents').users.seed._id
const scaffoldWorkEntityFromSeed = require('./work')
const convertImageUrl = require('controllers/images/lib/convert_image_url')

// seed attributes:
// MUST have: isbn
// MAY have: title, authors, image, publicationDate, numberOfPages
// Data deduced from isbn: isbn13h, groupLang

// Motivation to accept seeds without title or author:
// Every isbn needs to have its edition entity and an associated author entity,
// thus we create the expected entities whatsoever

module.exports = async seed => {
  const { isbn } = seed
  if (!_.isNonEmptyString(isbn)) {
    throw error_.new('missing isbn', 400, seed)
  }

  _.log(seed, 'edition seed')

  const isbnData = parseIsbn(seed.isbn)

  if (isbnData == null) throw error_.new('invalid isbn', 400, seed)

  Object.assign(seed, isbnData)

  const { isbn13 } = seed

  if (cache[isbn13] == null) {
    const promise = createEditionEntity(seed, scaffoldWorkEntityFromSeed(seed))
    cache[isbn13] = promise
    promise.finally(clearCache(isbn13))
  }

  return cache[isbn13]
}

// Use a cache to prevent creating several entities with the same ISBN
// at about the same time
const cache = {}

const clearCache = isbn13 => () => {
  const remove = () => delete cache[isbn13]
  // Let a large delay to be sure CouchDB view had the time to update
  return setTimeout(remove, 10000)
}

const createEditionEntity = async (seed, workPromise) => {
  if (seed.image) {
    try {
      const { hash } = await convertImageUrl(seed.image)
      seed.imageHash = hash
    } catch (err) {
      // do not crash the function, if the image url conversion failed
      _.error(err, `couldn't convert seed image url: ${seed.image}`)
    }
  }

  // The title is set hereafter as monolingual title (wdt:P1476)
  // instead of as a label
  const labels = {}
  const claims = {
    'wdt:P31': [ 'wd:Q3331189' ],
    'wdt:P212': [ seed.isbn13h ]
  }
  // wdt:P957 and wdt:P407 will be inferred from wdt:P212

  addClaimIfValid(claims, 'wdt:P1476', seed.title)
  addClaimIfValid(claims, 'invp:P2', seed.imageHash)
  addClaimIfValid(claims, 'wdt:P577', seed.publicationDate)
  addClaimIfValid(claims, 'wdt:P1104', seed.numberOfPages)

  return workPromise
  .then(work => {
    const workUri = work.uri || `inv:${work._id}`
    claims['wdt:P629'] = [ workUri ]
    return createInvEntity({ labels, claims, userId: seedUserId })
  })
  .then(_.Log('created edition entity'))
  .catch(_.ErrorRethrow('createEditionEntity err'))
}

const addClaimIfValid = (claims, property, value) => {
  if (value != null && properties[property].validate(value)) {
    claims[property] = [ value ]
  }
}
