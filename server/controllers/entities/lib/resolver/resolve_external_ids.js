const _ = require('builders/utils')
const properties = require('../properties/properties_values_constraints')
const { prefixifyWd } = require('controllers/entities/lib/prefix')
const entities_ = require('controllers/entities/lib/entities')
const runWdQuery = require('data/wikidata/run_query')
const getInvEntityCanonicalUri = require('../get_inv_entity_canonical_uri')
const { forceArray } = require('lib/utils/base')

module.exports = async (claims, resolveOnWikidata = true) => {
  console.log('resolve_external_ids.js', 10, { claims, resolveOnWikidata })
  const externalIds = []

  for (const prop in claims) {
    console.log('resolve_external_ids.js', 14)
    const values = claims[prop]
    console.log('resolve_external_ids.js', 16, { prop, values })
    if (properties[prop].isExternalId) {
      console.log('resolve_external_ids.js', 18)
      forceArray(values).forEach(value => externalIds.push([ prop, value ]))
    }
  }

  if (externalIds.length === 0) return

  const requests = [ invQuery(externalIds) ]
  if (resolveOnWikidata) { requests.push(wdQuery(externalIds)) }

  return Promise.all(requests)
  .then(_.Log('RES'))
  .then(_.flatten)
}

const wdQuery = async externalIds => {
  const results = await runWdQuery({ query: 'resolve-external-ids', externalIds })
  return results.map(prefixifyWd)
}

const invQuery = externalIds => {
  console.log('resolve_external_ids.js', 34, { externalIds })
  return Promise.all(externalIds.map(invByClaim))
  .then(_.flatten)
}

const invByClaim = async ([ prop, value ]) => {
  const entities = await entities_.byClaim(prop, value, true, true)
  console.log("🚀 ~ file: resolve_external_ids.js ~ line 46 ~ invByClaim ~ entities", entities)
  return entities.map(getInvEntityCanonicalUri)
}
