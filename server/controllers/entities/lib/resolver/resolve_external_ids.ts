import { flatten, uniqBy } from 'lodash-es'
import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import { getClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { prefixifyWd, prefixifyWdProperty } from '#controllers/entities/lib/prefix'
import type { PropertyValuePair } from '#data/wikidata/queries/queries'
import type { ResolvedExternalIdTriple } from '#data/wikidata/queries/resolve_external_ids'
import { runWdQuery } from '#data/wikidata/run_query'
import { forceArray, objectEntries } from '#lib/utils/base'
import type { Claims, EntityUri, PropertyUri } from '#types/entity'
import type { PropertyValueConstraints } from '#types/property'
import { getInvEntityCanonicalUri } from '../get_inv_entity_canonical_uri.js'
import { propertiesValuesConstraints as properties } from '../properties/properties_values_constraints.js'

interface ResolveExternalIdsOptions {
  resolveOnWikidata?: boolean
  resolveLocally?: boolean
  refresh?: boolean
}

interface Triple {
  subject: EntityUri
  property: PropertyUri
  value: string
}

export async function resolveExternalIds (claims: Claims, options: ResolveExternalIdsOptions = {}) {
  const { resolveOnWikidata = true, resolveLocally = true, refresh = false } = options
  const propertyValuePairs: PropertyValuePair[] = []

  for (const [ property, propertyClaims ] of objectEntries(claims)) {
    const propertyConstraints = properties[property] as PropertyValueConstraints
    const { concurrency } = propertyConstraints
    // Checks for external ids and identifiers typed as concurrent strings such as ISBNs
    if (concurrency) {
      const { format } = propertyConstraints
      // @ts-expect-error There are still untyped consumers that might pass loose claims, thus the need to forceArray
      forceArray(propertyClaims).map(getClaimValue).forEach(value => {
        if (format) value = format(value)
        propertyValuePairs.push([ property, value ])
      })
    }
  }

  if (propertyValuePairs.length === 0) return

  const requests = []
  if (resolveLocally) requests.push(invQuery(propertyValuePairs))
  if (resolveOnWikidata) requests.push(wdQuery(propertyValuePairs, refresh))

  const results = await Promise.all(requests)
  return uniqBy(flatten(results), 'subject') as Triple[]
}

async function wdQuery (propertyValuePairs: PropertyValuePair[], refresh: boolean) {
  const results = await runWdQuery({ query: 'resolve_external_ids', propertyValuePairs, refresh })
  return results.map(prefixifyResult)
}

function prefixifyResult (result: ResolvedExternalIdTriple) {
  const { subject, property, value } = result
  return {
    subject: prefixifyWd(subject),
    property: prefixifyWdProperty(property),
    value,
  }
}

async function invQuery (propertyValuePairs: PropertyValuePair[]) {
  const results = await Promise.all(propertyValuePairs.map(invByClaim))
  return flatten(results)
}

async function invByClaim ([ property, value ]: PropertyValuePair) {
  const entities = await getInvEntitiesByClaim(property, value, true, true)
  return entities.map(uri => {
    return {
      subject: getInvEntityCanonicalUri(uri),
      property,
      value,
    }
  })
}
