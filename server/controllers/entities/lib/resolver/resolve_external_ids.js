import _ from '#builders/utils'
import { getEntitiesByClaim } from '#controllers/entities/lib/entities'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import runWdQuery from '#data/wikidata/run_query'
import { forceArray } from '#lib/utils/base'
import getInvEntityCanonicalUri from '../get_inv_entity_canonical_uri.js'
import properties from '../properties/properties_values_constraints.js'

export async function resolveExternalIds (claims, resolveOnWikidata = true) {
  const externalIds = []

  for (const prop in claims) {
    const values = claims[prop]
    const { isExternalId, format } = properties[prop]
    if (isExternalId) {
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
  .then(_.flatten)
  .then(_.uniq)
}

const wdQuery = async externalIds => {
  const results = await runWdQuery({ query: 'resolve-external-ids', externalIds })
  return results.map(prefixifyWd)
}

const invQuery = externalIds => {
  return Promise.all(externalIds.map(invByClaim))
  .then(_.flatten)
}

const invByClaim = async ([ prop, value ]) => {
  const entities = await getEntitiesByClaim(prop, value, true, true)
  return entities.map(getInvEntityCanonicalUri)
}
