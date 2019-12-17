const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const promises_ = __.require('lib', 'promises')
const wdk = require('wikidata-sdk')
const { isValidIsbn } = __.require('lib', 'isbn/isbn')

// Getters take ids, return an object on the model { entities, notFound }
const getters = {
  inv: require('./get_inv_entities'),
  wd: require('./get_wikidata_enriched_entities'),
  isbn: require('./get_entities_by_isbns')
}

const prefixes = Object.keys(getters)

module.exports = params => {
  const { uris, list } = params
  assert_.array(uris)
  const domains = validateAndGetDomains(uris)
  const mergeResponses = list ? formatList : formatRichResults

  return getDomainsPromises(domains, params)
  .then(mergeResponses)
  .catch(_.ErrorRethrow(`getEntitiesByUris err: ${uris.join('|')}`))
}

const validateAndGetDomains = uris => {
  // validate per URI to be able to return a precise error message
  const domains = {}
  uris.forEach(validateAndGetDomainFromUri(domains))
  return domains
}

const validateAndGetDomainFromUri = domains => uri => {
  const [ prefix, id ] = uri.split(':')

  validatePrefix(prefix, uri)
  validateId(prefix, id, uri)

  if (!domains[prefix]) { domains[prefix] = [] }
  domains[prefix].push(id)
}

const validateId = (prefix, id, uri) => {
  if (!validators[prefix](id)) {
    const errMessage = `invalid uri id: ${id} (uri: ${uri})`
    return error_.reject(errMessage, 400, uri)
  }
}

const validatePrefix = (prefix, uri) => {
  if (!prefixes.includes(prefix)) {
    const errMessage = `invalid uri prefix: ${prefix} (uri: ${uri})`
    return error_.reject(errMessage, 400, uri)
  }
}

const getDomainsPromises = (domains, params) => {
  const promises = []

  for (const prefix in domains) {
    const uris = domains[prefix]
    promises.push(getters[prefix](uris, params))
  }

  return promises_.all(promises)
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
  buildResponse(response, results)
  response.entities = _.keyBy(response.entities, 'uri')
  if (response.notFound.length === 0) delete response.notFound
  return response
}

const buildResponse = (response, results) => {
  for (const result of results) {
    assert_.array(result.entities)
    result.entities.forEach(deleteRedirects(response))
    // Concat all entities
    response.entities = response.entities.concat(result.entities)
    // Concat the list of not found URIs
    if (result.notFound) {
      response.notFound = response.notFound.concat(result.notFound)
    }
  }
}
const deleteRedirects = response => entity => {
  if (entity.redirects) {
    const { from, to } = entity.redirects
    assert_.strings([ from, to ])
    response.redirects[from] = to
    delete entity.redirects
  }
}

const validators = {
  inv: _.isInvEntityId,
  wd: wdk.isItemId,
  isbn: isValidIsbn
}
