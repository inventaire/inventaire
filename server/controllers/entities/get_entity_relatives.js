const __ = require('config').universalPath
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')
const getAuthorWorks = require('./lib/get_author_works')
const getSerieParts = require('./lib/get_serie_parts')
const getPublisherPublications = require('./lib/get_publisher_publications')

const sanitization = {
  uri: {},
  refresh: { optional: true }
}

const entityRelativesController = getRelativesFromUri => (req, res) => {
  sanitize(req, res, sanitization)
  .then(getRelativesFromUri)
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

module.exports = {
  authorWorks: entityRelativesController(getAuthorWorks),
  serieParts: entityRelativesController(getSerieParts),
  publisherPublications: entityRelativesController(getPublisherPublications)
}
