import getAuthorWorks from './lib/get_author_works'
import getSerieParts from './lib/get_serie_parts'
import getPublisherPublications from './lib/get_publisher_publications'

const sanitization = {
  uri: {},
  refresh: { optional: true }
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
