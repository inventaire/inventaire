import getAuthorWorks from './lib/get_author_works.js'
import getPublisherPublications from './lib/get_publisher_publications.js'
import getSerieParts from './lib/get_serie_parts.js'

const sanitization = {
  uri: {},
  refresh: { optional: true },
}

export default {
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
}
