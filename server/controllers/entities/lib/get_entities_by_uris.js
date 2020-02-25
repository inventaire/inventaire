const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const wdk = require('wikidata-sdk')
const { isValidIsbn } = __.require('lib', 'isbn/isbn')

// Getters take ids, return an object on the model { entities, notFound }
const getters = {
  inv: require('./get_inv_entities'),
  wd: require('./get_wikidata_enriched_entities'),
  isbn: require('./get_entities_by_isbns')
}

const prefixes = Object.keys(getters)

module.exports = async params => {
  const { uris, list } = params
  assert_.array(uris)
  const domains = {}

  // validate per URI to be able to return a precise error message
  for (const uri of uris) {
    let errMessage
    const [ prefix, id ] = uri.split(':')

    if (!prefixes.includes(prefix)) {
      errMessage = `invalid uri prefix: ${prefix} (uri: ${uri})`
      throw error_.new(errMessage, 400, uri)
    }

    if (!validators[prefix](id)) {
      errMessage = `invalid uri id: ${id} (uri: ${uri})`
      throw error_.new(errMessage, 400, uri)
    }

    if (!domains[prefix]) { domains[prefix] = [] }
    domains[prefix].push(id)
  }

  const mergeResponses = list ? formatList : formatRichResults

  return getDomainsPromises(domains, params)
  .then(mergeResponses)
  .catch(_.ErrorRethrow(`getEntitiesByUris err: ${uris.join('|')}`))
}

const getDomainsPromises = (domains, params) => {
  const promises = []

  for (const prefix in domains) {
    const uris = domains[prefix]
    promises.push(getters[prefix](uris, params))
  }

  return Promise.all(promises)
}

const formatList = results => _.flatten(_.map(results, 'entities'))

const formatRichResults = results => {
  const response = {
    // entities are a array until they are indexed by uri hereafter
    entities: [],
    // collect redirections at the response root to let the possibility
    // to the client to alias entities
    redirects: {},
    notFound: []
  }

  for (const result of results) {
    assert_.array(result.entities)
    for (const entity of result.entities) {
      if (entity.redirects) {
        const { from, to } = entity.redirects
        assert_.strings([ from, to ])
        response.redirects[from] = to
        delete entity.redirects
      }
    }

    // Concat all entities
    response.entities = response.entities.concat(result.entities)

    // Concat the list of not found URIs
    if (result.notFound) {
      response.notFound = response.notFound.concat(result.notFound)
    }
  }

  response.entities = _.keyBy(response.entities, 'uri')

  if (response.notFound.length === 0) delete response.notFound

  return response
}

const validators = {
  inv: _.isInvEntityId,
  wd: wdk.isItemId,
  isbn: isValidIsbn
}
