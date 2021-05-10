const _ = require('builders/utils')
const entities_ = require('./entities')
const formatEditionEntity = require('./format_edition_entity')
const isbn_ = require('lib/isbn/isbn')
const { prefixifyIsbn } = require('controllers/entities/lib/prefix')
const getResolvedSeed = require('data/dataseed/get_resolved_seed')

module.exports = async (rawIsbns, params = {}) => {
  const [ isbns, redirections ] = getRedirections(rawIsbns)
  const { autocreate } = params
  // search entities by isbn locally
  let entities = await entities_.byIsbns(isbns)
  const foundIsbns = entities.map(getIsbn13h)
  const missingIsbns = _.difference(isbns, foundIsbns)

  entities = entities.map(formatEditionEntity)

  if (missingIsbns.length === 0) {
    const results = { entities }
    return addRedirections(results, redirections)
  }
  const results = { entities }

  if (autocreate) {
    const resolvedEditions = await Promise.all(missingIsbns.map(isbn => getResolvedSeed(isbn)))
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
  const { isbn13: uriIsbn, isbn13h: claimIsbn } = isbn_.parse(rawIsbn)
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
