import { flatten, uniq } from 'lodash-es'
import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import { getClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import runWdQuery from '#data/wikidata/run_query'
import { forceArray, objectEntries } from '#lib/utils/base'
import type { Claims } from '#server/types/entity'
import { getInvEntityCanonicalUri } from '../get_inv_entity_canonical_uri.js'
import { propertiesValuesConstraints as properties } from '../properties/properties_values_constraints.js'

export async function resolveExternalIds (claims: Claims, resolveOnWikidata = true) {
  const externalIds = []

  for (const [ property, propertyClaims ] of objectEntries(claims)) {
    const propertyConstraints = properties[property]
    if (propertyConstraints.datatype === 'external-id') {
      let format
      if ('format' in propertyConstraints) format = propertyConstraints.format
      forceArray(propertyClaims).map(getClaimValue).forEach(value => {
        if (format) value = format(value)
        externalIds.push([ property, value ])
      })
    }
  }

  if (externalIds.length === 0) return

  const requests = [ invQuery(externalIds) ]
  if (resolveOnWikidata) { requests.push(wdQuery(externalIds)) }

  const results = await Promise.all(requests)
  return uniq(flatten(results)) as EntityUri[]
}

async function wdQuery (externalIds) {
  const results = await runWdQuery({ query: 'resolve-external-ids', externalIds })
  return results.map(prefixifyWd)
}

async function invQuery (externalIds) {
  const results = await Promise.all(externalIds.map(invByClaim))
  return flatten(results)
}

async function invByClaim ([ prop, value ]) {
  const entities = await getInvEntitiesByClaim(prop, value, true, true)
  return entities.map(getInvEntityCanonicalUri)
}
