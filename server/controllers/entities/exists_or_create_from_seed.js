// An endpoint to take advantage of data we are given through data imports
// instead of relying on dataseed
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
let error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')
error_ = __.require('lib', 'error/error')
const entities_ = require('./lib/entities')
const scaffoldFromSeed = require('./lib/scaffold_entity_from_seed/edition')
const { enabled: dataseedEnabled } = CONFIG.dataseed
const dataseed = __.require('data', 'dataseed/dataseed')
const formatEditionEntity = require('./lib/format_edition_entity')

const sanitization = {
  isbn: {},
  title: {},
  authors: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(seed => {
    const { isbn } = seed
    const authors = seed.authors || []

    seed.authors = authors.filter(_.isNonEmptyString)

    return entities_.byIsbn(isbn)
    .then(findOrCreateEntity(seed))
    .then(formatEditionEntity)
    .then(responses_.Send(res))
  })
  .catch(error_.Handler(req, res))
}

const findOrCreateEntity = seed => entityDoc => {
  return entityDoc || addImage(seed).then(scaffoldFromSeed)
}

const addImage = async seed => {
  if (!dataseedEnabled) return seed

  try {
    seed.image = await findImageFromSeed(seed)
  } catch (err) {
    _.error(err, 'add image err')
  }

  return seed
}

const findImageFromSeed = async seed => {
  // Try to find an image from the seed ISBN
  const { url: isbnImageUrl } = await dataseed.getImageByIsbn(seed.isbn)
  if (isbnImageUrl) return isbnImageUrl

  // Else, if an image was provided in the seed, try to use it
  const { url: seedImageUrl } = await dataseed.getImageByUrl(seed.image)
  if (seedImageUrl) return seedImageUrl
}
