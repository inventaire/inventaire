import { difference } from 'lodash-es'
import { getInvEntitiesByIsbns } from '#controllers/entities/lib/entities'
import { prefixifyIsbn } from '#controllers/entities/lib/prefix'
import { enrichAndGetEditionEntityFromIsbn } from '#data/dataseed/enrich_and_get_edition_entity_from_isbn'
import { parseIsbn } from '#lib/isbn/parse'
import formatEditionEntity from './format_edition_entity.js'

export default async (rawIsbns, params = {}) => {
  const [ isbns, redirections ] = getRedirections(rawIsbns)
  const { autocreate, refresh } = params
  if (autocreate && refresh) {
    // Enrich editions that can be, but let getInvEntitiesByIsbns get the results
    // as enrichAndGetEditionEntityFromIsbn might return { isbn, notFound: true }
    // even if the local database has an existing entity with that ISBN.
    // Likely because getAuthoritiesAggregatedEntry didn't find anything
    await Promise.all(isbns.map(isbn => enrichAndGetEditionEntityFromIsbn(isbn)))
  }
  let entities = await getInvEntitiesByIsbns(isbns)
  const foundIsbns = entities.map(getIsbn13h)
  const missingIsbns = difference(isbns, foundIsbns)

  entities = entities.map(formatEditionEntity)

  if (missingIsbns.length === 0) {
    const results = { entities }
    return addRedirections(results, redirections)
  }
  const results = { entities }

  // The cases where autocreate && refresh was already checked above
  if (autocreate && !refresh) {
    const resolvedEditions = await Promise.all(missingIsbns.map(isbn => enrichAndGetEditionEntityFromIsbn(isbn)))
    const newEntities = []
    const notFound = []
    for (const resolvedEdition of resolvedEditions) {
      if (resolvedEdition.notFound) notFound.push(prefixifyIsbn(resolvedEdition.isbn))
      else newEntities.push(resolvedEdition)
    }
    results.entities = entities.concat(newEntities)
    if (notFound.length > 0) results.notFound = notFound
  } else {
    results.notFound = missingIsbns.map(prefixifyIsbn)
  }

  return addRedirections(results, redirections)
}

const getIsbn13h = entity => entity.claims['wdt:P212'][0]

const getRedirections = isbns => {
  // isbns list, redirections object
  const accumulator = [ [], {} ]
  return isbns.reduce(aggregateIsbnRedirections, accumulator)
}

// Redirection mechanism is coupled with the way
// ./get_entities_by_uris 'mergeResponses' parses redirections
const aggregateIsbnRedirections = (accumulator, rawIsbn) => {
  const { isbn13: uriIsbn, isbn13h: claimIsbn } = parseIsbn(rawIsbn)
  const rawUri = `isbn:${rawIsbn}`
  const uri = `isbn:${uriIsbn}`
  accumulator[0].push(claimIsbn)
  if (rawUri !== uri) { accumulator[1][uri] = { from: rawUri, to: uri } }
  return accumulator
}

const addRedirections = (results, redirections) => {
  results.entities = results.entities.map(entity => {
    const { uri } = entity
    const redirects = redirections[uri]
    if (redirects != null) { entity.redirects = redirects }
    return entity
  })

  return results
}
