import { isNonEmptyString } from '#lib/boolean_validations'
import { forceArray, objectEntries, simpleDay } from '#lib/utils/base'
import type { InvSimplifiedPropertyClaims, Reference, ReferenceProperty } from '#types/entity'
import type { EntityLooseSeed, ResolverEntry } from '#types/resolver'

export function addClaimsReferences (entry: ResolverEntry, property: ReferenceProperty) {
  if (!entry) return
  addReferenceToSeedClaims(entry.edition, property)
  entry.works.forEach(work => addReferenceToSeedClaims(work, property))
  entry.authors.forEach(author => addReferenceToSeedClaims(author, property))
}

export function addReferenceToSeedClaims (seed: EntityLooseSeed, sourceProperty: ReferenceProperty) {
  if (!seed.claims) return
  const { claims } = seed
  const externalId = claims[sourceProperty]
  if (!isNonEmptyString(externalId)) return
  const reference: Reference = {
    [sourceProperty]: [ externalId ],
    'wdt:P813': [ simpleDay() ],
  }
  for (const [ property, propertyLooseClaims ] of objectEntries(claims)) {
    if (property !== sourceProperty) {
      // @ts-expect-error
      const propertyClaimsValues: InvSimplifiedPropertyClaims = forceArray(propertyLooseClaims)
      const propertyClaimsObjects = propertyClaimsValues.map(claim => {
        return {
          value: claim,
          references: [ reference ],
        }
      })
      // @ts-expect-error
      claims[property] = propertyClaimsObjects as InvExpandedPropertyClaims
    } else {
      // @ts-expect-error
      claims[property] = forceArray(claims[property]).map(value => ({ value })) as InvExpandedPropertyClaims
    }
  }
}
