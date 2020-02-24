const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const searchWikidataByText = __.require('data', 'wikidata/search_by_text')
const searchInvEntities = require('./search_inv_entities')
const getEntitiesByUris = require('./get_entities_by_uris')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const { getInvEntityUri } = __.require('controllers', 'entities/lib/prefix')

module.exports = query => {
  assert_.object(query)
  const { refresh } = query

  return Promise.all([
    searchWikidataByText(query),
    searchInvByText(query)
  ])
  .then(mergeResults)
  .then(replaceEditionsByTheirWork(refresh))
  .then(_.values)
  .catch(_.ErrorRethrow('search by text err'))
}

const searchInvByText = (query, key) => {
  const { search } = query

  return searchInvEntities(search)
  // It's ok to use the inv URI even if its not the canonical URI
  // (wd and isbn URI are prefered) as getEntitiesByUris will
  // take care of finding the right URI downward
  .map(getInvEntityUri)
  .then(uris => getEntitiesByUris({ uris }))
  .catch(error_.notFound)
}

const mergeResults = results => {
  return _(results)
  .compact()
  .map('entities')
  .merge()
  .value()
}

const replaceEditionsByTheirWork = refresh => entities => {
  let missingWorkEntities = []

  for (const uri in entities) {
    const entity = entities[uri]
    if (entity.type === 'edition') {
      const { claims } = entity
      const workUri = claims['wdt:P629'] && claims['wdt:P629'][0]
      if (workUri) {
        // Ensure that the edition work is in the results
        if (entities[workUri] == null) missingWorkEntities.push(workUri)
        // Remove the edition from the results as it will be fetched later
        // as an edition of its work
      } else {
        // Example: wd:Q24200032
        _.warn(entity, 'edition without an associated work: ignored')
      }
      delete entities[uri]
    }
  }

  missingWorkEntities = _.uniq(missingWorkEntities)
  _.log(missingWorkEntities, 'missingWorkEntities from editions')

  return getEntitiesByUris({ uris: missingWorkEntities, refresh })
  .then(results => Object.assign(entities, results.entities))
}
