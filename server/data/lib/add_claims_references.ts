import { isNonEmptyString } from '#lib/boolean_validations'
import { forceArray, objectEntries, simpleDay } from '#lib/utils/base'
import type { AbsoluteUrl } from '#server/types/common'
import type { InvSimplifiedPropertyClaims, Reference } from '#server/types/entity'
import type { EntityLooseSeed, ResolverEntry } from '#server/types/resolver'

const sources = {
  'wdt:P268': id => `https://catalogue.bnf.fr/ark:/12148/cb${id}`,
  'wdt:P950': id => `https://datos.bne.es/resource/${id}`,
} as const

type SourceProperty = keyof typeof sources

export function addClaimsReferences (entry: ResolverEntry, property: SourceProperty) {
  if (!entry) return
  addReferenceToSeedClaims(entry.edition, property)
  entry.works.forEach(work => addReferenceToSeedClaims(work, property))
  entry.authors.forEach(author => addReferenceToSeedClaims(author, property))
}

export function addReferenceToSeedClaims (seed: EntityLooseSeed, property: SourceProperty) {
  if (!seed.claims) return
  const { claims } = seed
  const externalId = claims[property]
  if (!isNonEmptyString(externalId)) return
  const referenceUrl = sources[property](externalId) as AbsoluteUrl
  const reference: Reference = {
    'wdt:P854': [ referenceUrl ],
    'wdt:P813': [ simpleDay() ],
  }
  for (const [ property, propertyLooseClaims ] of objectEntries(claims)) {
    const propertyClaimsValues: InvSimplifiedPropertyClaims = forceArray(propertyLooseClaims)
    const propertyClaimsObjects = propertyClaimsValues.map(claim => {
      return {
        value: claim,
        references: [ reference ],
      }
    })
    // @ts-expect-error
    claims[property] = propertyClaimsObjects as InvExpandedPropertyClaims
  }
}
