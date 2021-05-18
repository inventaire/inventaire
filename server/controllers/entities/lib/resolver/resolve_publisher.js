const _ = require('builders/utils')
const parseIsbn = require('lib/isbn/parse')
const reverseClaims = require('controllers/entities/lib/reverse_claims')
const getEntitiesList = require('controllers/entities/lib/get_entities_list')
const leven = require('leven')

const resolvePublisher = async (isbn, publisherLabel) => {
  const { publisherPrefix } = parseIsbn(isbn)
  const claims = await reverseClaims({ property: 'wdt:P3035', value: publisherPrefix })
  if (claims.length === 0) return
  const possiblePublishers = await getEntitiesList(claims)
  const publisher = possiblePublishers
    .map(getPublisherClosestTerm(publisherLabel))
    .sort(byDistance)[0]
  return publisher.uri
}

const getPublisherClosestTerm = publisherLabel => entity => {
  const closestTerm = getClosestTerm(entity, publisherLabel)
  const id = entity.uri.split(':')[1]
  return {
    uri: `wd:${id}`,
    distance: closestTerm.distance
  }
}

const getClosestTerm = ({ labels, aliases }, publisherLabel) => {
  const allAliases = _.flatten(Object.values(aliases))
  const terms = Object.values(labels).concat(allAliases)
  return _.uniq(terms)
  .map(term => ({ term, distance: leven(term, publisherLabel) }))
  .sort(byDistance)[0]
}

const byDistance = (a, b) => a.distance - b.distance

module.exports = { resolvePublisher }
