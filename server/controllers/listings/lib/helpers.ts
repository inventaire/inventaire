import { keyBy } from 'lodash-es'
import { paginate, type PageParams } from '#lib/pagination'
import type { Listing } from '#server/types/listing'

export function filterFoundElementsUris (elements, uris) {
  const foundElements = []
  const notFoundUris = []
  const elementsByUris = keyBy(elements, 'uri')
  uris.forEach(assignElement(elementsByUris, foundElements, notFoundUris))
  return { foundElements, notFoundUris }
}

const assignElement = (elementsByUris, foundElements, notFoundUris) => uri => {
  const element = elementsByUris[uri]
  if (element) foundElements.push(element)
  else notFoundUris.push(uri)
}

export function paginateListings (listings: Listing[], params: PageParams) {
  const { page, total, offset, continue: continu } = paginate<Listing>(listings, params)
  return { listings: page, total, offset, continue: continu }
}
