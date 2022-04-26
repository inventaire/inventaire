const _ = require('builders/utils')
const parseIsbn = require('lib/isbn/parse')
const leven = require('leven')
// Arbitrary tolerance threshold to accept, for instance, accents differences in publishers names
const maximumNameDistance = 3

let getEntitiesList, reverseClaims
const requireCircularDependencies = () => {
  getEntitiesList = require('controllers/entities/lib/get_entities_list')
  reverseClaims = require('controllers/entities/lib/reverse_claims')
}
setImmediate(requireCircularDependencies)

const resolvePublisher = async (isbn, publisherLabel) => {
  const isbnData = parseIsbn(isbn)
  if (!isbnData) throw new Error(`invalid isbn: ${isbn}`)
  const { publisherPrefix } = isbnData
  const isbnPrefixPublishersUris = await reverseClaims({ property: 'wdt:P3035', value: publisherPrefix })
  if (isbnPrefixPublishersUris.length === 0) return
  const isbnPrefixPublishers = await getEntitiesList(isbnPrefixPublishersUris)
  const matchingPublishers = getMatchingPublishers(publisherLabel, isbnPrefixPublishers)
  if (matchingPublishers.length === 1) return matchingPublishers[0].uri
}

const getMatchingPublishers = (publisherLabel, isbnPrefixPublishers) => {
  return isbnPrefixPublishers
  .map(getPublisherClosestTerm(publisherLabel))
  .filter(publisher => publisher.distance <= maximumNameDistance)
}

const getPublisherClosestTerm = publisherLabel => entity => {
  const closestTerm = getClosestTerm(entity, publisherLabel)
  const id = entity.uri.split(':')[1]
  return {
    uri: `wd:${id}`,
    distance: closestTerm.distance
  }
}

const getClosestTerm = ({ labels, aliases = {} }, publisherLabel) => {
  const allAliases = Object.values(aliases).flat()
  const terms = Object.values(labels).concat(allAliases)
  return _.uniq(terms)
  .map(term => ({ term, distance: leven(term, publisherLabel) }))
  .sort(byDistance)[0]
}

const byDistance = (a, b) => a.distance - b.distance

module.exports = { resolvePublisher }
