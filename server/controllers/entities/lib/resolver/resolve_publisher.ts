import leven from 'leven'
import { uniq } from 'lodash-es'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { getReverseClaims } from '#controllers/entities/lib/reverse_claims'
import { parseIsbn } from '#lib/isbn/parse'
import type { SerializedEntity } from '#types/entity'
// Arbitrary tolerance threshold to accept, for instance, accents differences in publishers names
const maximumNameDistance = 3

export async function resolvePublisher (isbn: string, publisherLabel: string) {
  const isbnData = parseIsbn(isbn)
  if (!isbnData) throw new Error(`invalid isbn: ${isbn}`)
  const { publisherPrefix } = isbnData
  const isbnPrefixPublishersUris = await getReverseClaims({ property: 'wdt:P3035', value: publisherPrefix })
  if (isbnPrefixPublishersUris.length === 0) return
  const isbnPrefixPublishers = await getEntitiesList(isbnPrefixPublishersUris)
  const matchingPublishers = getMatchingPublishers(publisherLabel, isbnPrefixPublishers)
  if (matchingPublishers.length === 1) return matchingPublishers[0].uri
}

function getMatchingPublishers (publisherLabel: string, isbnPrefixPublishers: SerializedEntity[]) {
  return isbnPrefixPublishers
  .map(getPublisherClosestTerm(publisherLabel))
  .filter(publisher => publisher.distance <= maximumNameDistance)
}

const getPublisherClosestTerm = (publisherLabel: string) => (entity: SerializedEntity) => {
  const closestTerm = getClosestTerm(entity, publisherLabel)
  const { uri } = entity
  return {
    uri,
    distance: closestTerm.distance,
  }
}

function getClosestTerm ({ labels, aliases = {} }, publisherLabel) {
  const allAliases = Object.values(aliases).flat()
  const terms = Object.values(labels).concat(allAliases)
  return uniq(terms)
  .map(term => ({ term, distance: leven(term, publisherLabel) }))
  .sort(byDistance)[0]
}

const byDistance = (a, b) => a.distance - b.distance
