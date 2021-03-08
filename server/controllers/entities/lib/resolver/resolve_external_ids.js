const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const properties = require('../properties/properties_values_constraints')
const { prefixifyWd } = require('controllers/entities/lib/prefix')
const entities_ = require('controllers/entities/lib/entities')
const runWdQuery = require('data/wikidata/run_query')
const getInvEntityCanonicalUri = require('../get_inv_entity_canonical_uri')

module.exports = async (claims, resolveOnWikidata = true) => {
  const externalIds = []

  for (const prop in claims) {
    const values = claims[prop]
    if (properties[prop].isExternalId) {
      values.forEach(value => externalIds.push([ prop, value ]))
    }
  }

  if (externalIds.length === 0) return

  const requests = [ invQuery(externalIds) ]
  if (resolveOnWikidata) { requests.push(wdQuery(externalIds)) }

  return Promise.all(requests)
  .then(_.flatten)
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
  const entities = await entities_.byClaim(prop, value, true, true)
  return entities.map(getInvEntityCanonicalUri)
}
