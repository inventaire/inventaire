import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import getInvEntityCanonicalUri from '#controllers/entities/lib/get_inv_entity_canonical_uri'
import { normalizeTitle } from '#controllers/entities/lib/resolver/helpers'
import { objectEntries } from '#lib/utils/base'
import { findClaimByValue, getClaimValue, getFirstClaimValue } from '#models/entity'
import type { EditionSeed, WorkSeed } from '#server/types/resolver'
import type { InvEntity } from '#types/entity'

export default async function (editionSeed: EditionSeed, worksSeeds: WorkSeed[]) {
  if (editionSeed.uri) return
  // Only edition seeds with no known isbns can be resolved this way
  if (editionSeed.isbn) return
  const editionSeedTitle = getNormalizedTitle(editionSeed)
  // We need a title to resolve with existing editions
  if (editionSeedTitle == null) return
  if (worksSeeds.length !== 1) return
  const { uri: workUri } = worksSeeds[0]
  if (workUri == null) return
  const editions = await getInvEntitiesByClaim('wdt:P629', workUri, true, true)
  const matchingEditions = editions.filter(isMatchingEdition(editionSeed, editionSeedTitle))
  if (matchingEditions.length === 1) {
    const matchingEdition = matchingEditions[0]
    editionSeed.uri = getInvEntityCanonicalUri(matchingEdition)
  }
}

const isMatchingEdition = (editionSeed: EditionSeed, editionSeedTitle: string) => (edition: InvEntity) => {
  const title = getNormalizedTitle(edition)
  const titlesMatch = editionSeedTitle.includes(title) || title.includes(editionSeedTitle)
  const claimsDoNotContradict = editionSeedHasNoContradictingClaim(editionSeed, edition)
  return titlesMatch && claimsDoNotContradict
}

function getNormalizedTitle (edition: InvEntity | EditionSeed) {
  const { claims } = edition
  if (!claims) return
  const title = getFirstClaimValue(claims, 'wdt:P1476')
  if (title) return normalizeTitle(title)
}

function editionSeedHasNoContradictingClaim (editionSeed: EditionSeed, edition: InvEntity) {
  for (const [ property, propertyClaims ] of objectEntries(editionSeed.claims)) {
    if (!ignoredProperties.includes(property)) {
      for (const claim of propertyClaims) {
        if (edition.claims[property]) {
          const value = getClaimValue(claim)
          const matchingClaim = findClaimByValue(edition.claims[property], value)
          if (!matchingClaim) return false
        } else {
          return false
        }
      }
    }
  }
  return true
}

const ignoredProperties = [
  // The title is already checked in a more tolerant fashion
  'wdt:P1476',
]
