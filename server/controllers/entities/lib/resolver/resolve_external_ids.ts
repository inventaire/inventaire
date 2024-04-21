import { flatten, uniq } from 'lodash-es'
import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import runWdQuery from '#data/wikidata/run_query'
import { forceArray } from '#lib/utils/base'
import getInvEntityCanonicalUri from '../get_inv_entity_canonical_uri.js'
import { propertiesValuesConstraints as properties } from '../properties/properties_values_constraints.js'

export async function resolveExternalIds (claims, resolveOnWikidata = true) {
  const externalIds = []

  for (const prop in claims) {
    const values = claims[prop]
    const { datatype, format } = properties[prop]
    if (datatype === 'external-id') {
      forceArray(values).forEach(value => {
        if (format) value = format(value)
        externalIds.push([ prop, value ])
      })
    }
  }

  if (externalIds.length === 0) return

  const requests = [ invQuery(externalIds) ]
  if (resolveOnWikidata) { requests.push(wdQuery(externalIds)) }

  return Promise.all(requests)
  .then(flatten)
  .then(uniq)
}

async function wdQuery (externalIds) {
  const results = await runWdQuery({ query: 'resolve-external-ids', externalIds })
  return results.map(prefixifyWd)
}

function invQuery (externalIds) {
  return Promise.all(externalIds.map(invByClaim))
  .then(flatten)
}

async function invByClaim ([ prop, value ]) {
  const entities = await getInvEntitiesByClaim(prop, value, true, true)
  return entities.map(getInvEntityCanonicalUri)
}
