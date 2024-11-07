import { getAuthorWorks } from './lib/get_author_works.js'
import { getPublisherPublications } from './lib/get_publisher_publications.js'
import { getSerieParts } from './lib/get_serie_parts.js'

const sanitization = {
  uri: {},
  refresh: { optional: true },
}

export const authorWorks = {
  sanitization,
  controller: getAuthorWorks,
}
export type GetAuthorWorksResponse = Awaited<ReturnType<typeof getAuthorWorks>>

export const serieParts = {
  sanitization,
  controller: getSerieParts,
}
export type GetSeriePartsResponse = Awaited<ReturnType<typeof getSerieParts>>

export const publisherPublications = {
  sanitization,
  controller: getPublisherPublications,
}
export type GetPublisherPublicationsResponse = Awaited<ReturnType<typeof getPublisherPublications>>
