const __ = require('config').universalPath
const _ = require('builders/utils')
const entities_ = require('./entities')
const dataseed = require('data/dataseed/dataseed')
const scaffoldEditionEntityFromSeed = require('./scaffold_entity_from_seed/edition')
const formatEditionEntity = require('./format_edition_entity')
const isbn_ = require('lib/isbn/isbn')
const { prefixifyIsbn } = require('controllers/entities/lib/prefix')

module.exports = async (rawIsbns, params = {}) => {
  const [ isbns, redirections ] = getRedirections(rawIsbns)
  const { refresh, autocreate } = params
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
    const [ newEntities, notFound ] = await getMissingEditionEntitiesFromSeeds(missingIsbns, refresh)

    results.entities = entities.concat(newEntities)
    if (notFound.length > 0) {
      results.notFound = _.map(notFound, 'isbn').map(prefixifyIsbn)
    }
  } else {
    results.notFound = missingIsbns.map(prefixifyIsbn)
  }

  return addRedirections(results, redirections)
}

const getIsbn13h = entity => entity.claims['wdt:P212'][0]

const getMissingEditionEntitiesFromSeeds = async (isbns, refresh) => {
  const seeds = await dataseed.getByIsbns(isbns, refresh)
  const insufficientData = []
  const validSeeds = []
  // TODO: Filter out more aggressively bad quality seeds
  // - titles with punctuations
  // - authors with punctuations or single word
  for (const seed of seeds) {
    if (_.isNonEmptyString(seed.title)) {
      validSeeds.push(seed)
    } else {
      insufficientData.push(seed)
    }
  }

  const editionEntitiesScaffold = await Promise.all(validSeeds.map(scaffoldEditionEntityFromSeed))
  const newEntities = editionEntitiesScaffold.map(formatEditionEntity)
  return [ newEntities, insufficientData ]
}

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
