const getAuthorWorks = require('./lib/get_author_works')
const getSerieParts = require('./lib/get_serie_parts')
const getPublisherPublications = require('./lib/get_publisher_publications')
const getWorkEditions = require('./lib/get_work_editions')

const sanitization = {
  uri: {},
  refresh: { optional: true }
}

module.exports = {
  authorWorks: {
    sanitization,
    controller: getAuthorWorks,
  },
  serieParts: {
    sanitization,
    controller: getSerieParts,
  },
  publisherPublications: {
    sanitization,
    controller: getPublisherPublications,
  },
  workEditions: {
    sanitization,
    controller: getWorkEditions,
  },
}
