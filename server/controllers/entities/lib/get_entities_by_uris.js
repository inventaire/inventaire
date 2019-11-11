// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const promises_ = __.require('lib', 'promises')
const wdk = require('wikidata-sdk')
const { normalizeIsbn, isValidIsbn } = __.require('lib', 'isbn/isbn')

// Getters take ids, return an object on the model { entities, notFound }
const getters = {
  inv: require('./get_inv_entities'),
  wd: require('./get_wikidata_enriched_entities'),
  isbn: require('./get_entities_by_isbns')
}

const prefixes = Object.keys(getters)

module.exports = function(params){
  const { uris, list } = params
  assert_.array(uris)
  const domains = {}

  // validate per URI to be able to return a precise error message
  for (const uri of uris) {
    var errMessage
    const [ prefix, id ] = Array.from(uri.split(':'))

    if (!prefixes.includes(prefix)) {
      errMessage = `invalid uri prefix: ${prefix} (uri: ${uri})`
      return error_.reject(errMessage, 400, uri)
    }

    if (!validators[prefix](id)) {
      errMessage = `invalid uri id: ${id} (uri: ${uri})`
      return error_.reject(errMessage, 400, uri)
    }

    if (!domains[prefix]) { domains[prefix] = [] }
    domains[prefix].push(id)
  }

  const mergeResponses = list ? formatList : formatRichResults

  return getDomainsPromises(domains, params)
  .then(mergeResponses)
  .catch(_.ErrorRethrow(`getEntitiesByUris err: ${uris.join('|')}`))
}

var getDomainsPromises = function(domains, params){
  const promises = []

  for (const prefix in domains) {
    const uris = domains[prefix]
    promises.push(getters[prefix](uris, params))
  }

  return promises_.all(promises)
}

var formatList = results => _.flatten(_.map(results, 'entities'))

var formatRichResults = function(results){
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
      if (entity.redirects != null) {
        const { from, to } = entity.redirects
        assert_.strings([ from, to ])
        response.redirects[from] = to
        delete entity.redirects
      }
    }

    // concat all entities
    response.entities = response.entities.concat(result.entities)

    // concat the list of not found URIs
    if (result.notFound != null) {
      response.notFound = response.notFound.concat(result.notFound)
    }
  }

  response.entities = _.keyBy(response.entities, 'uri')

  if (response.notFound.length === 0) { delete response.notFound }

  return response
}

var validators = {
  inv: _.isInvEntityId,
  wd: wdk.isItemId,
  isbn: isValidIsbn
}
