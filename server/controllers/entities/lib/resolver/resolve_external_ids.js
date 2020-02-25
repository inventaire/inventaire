const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const properties = require('../properties/properties_values_constraints')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
const entities_ = __.require('controllers', 'entities/lib/entities')
const runWdQuery = __.require('data', 'wikidata/run_query')
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

const wdQuery = externalIds => {
  return runWdQuery({ query: 'resolve-external-ids', externalIds })
  .map(prefixifyWd)
}

const invQuery = externalIds => {
  return Promise.all(externalIds.map(invByClaim))
  .then(_.flatten)
}

const invByClaim = ([ prop, value ]) => {
  return entities_.byClaim(prop, value, true, true)
  .map(getInvEntityCanonicalUri)
}
