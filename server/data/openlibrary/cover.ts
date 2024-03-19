// a service to know if a cover is available
// could actually be turned into a generalist 'image-check' service
import { requests_ } from '#lib/requests'
import { coverByOlId } from './api.js'

const keyByType = {
  human: 'a',
  work: 'b',
  edition: 'b',
}

export default async (openLibraryId, entityType) => {
  if (!openLibraryId) return null

  const type = keyByType[entityType]
  if (!type) return null

  const url = coverByOlId(openLibraryId, type)
  const credits = { text: 'OpenLibrary', url }

  const coverExists = await checkCoverExistance(url)
  if (coverExists) return { url, credits }
  else return {}
}

const checkCoverExistance = async url => {
  // The default=false flag triggers a 404 response if the cover is missing
  // instead of a 200 response with a single-pixel image
  // See https://openlibrary.org/dev/docs/api/covers
  const { statusCode } = await requests_.head(`${url}?default=false`)
  return statusCode === 200
}
