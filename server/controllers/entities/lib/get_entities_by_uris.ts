import { flatMap, keyBy } from 'lodash-es'
import { isInvEntityId, isWdEntityId } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { isValidIsbn } from '#lib/isbn/isbn'
import { assert_ } from '#lib/utils/assert_types'
import { LogErrorAndRethrow } from '#lib/utils/logs'
import isbn from './get_entities_by_isbns.js'
import inv from './get_inv_entities.js'
import wd from './get_wikidata_enriched_entities.js'

// Getters take ids, return an object on the model { entities, notFound }
const getters = {
  inv,
  wd,
  isbn,
}

const prefixes = Object.keys(getters)

interface GetEntityByUrisArgs {
  uris: string[]
  refresh?: boolean
  list?: boolean
  dry?: boolean
  autocreate?: boolean
}

export async function getEntitiesByUris (params: GetEntityByUrisArgs) {
  const { uris, list } = params
  assert_.array(uris)
  const domains = {}

  // validate per URI to be able to return a precise error message
  for (const uri of uris) {
    let errMessage
    const [ prefix, id ] = uri.split(':')

    if (!prefixes.includes(prefix)) {
      errMessage = `invalid uri prefix: ${prefix} (uri: ${uri})`
      throw newError(errMessage, 400, uri)
    }

    if (!validators[prefix](id)) {
      errMessage = `invalid uri id: ${id} (uri: ${uri})`
      throw newError(errMessage, 400, uri)
    }

    if (!domains[prefix]) { domains[prefix] = [] }
    domains[prefix].push(id)
  }

  const mergeResponses = list ? formatList : formatRichResults

  return getDomainsPromises(domains, params)
  .then(mergeResponses)
  .catch(LogErrorAndRethrow(`getEntitiesByUris err: ${uris.join('|')}`))
}

const getDomainsPromises = (domains, params) => {
  const promises = []

  for (const prefix in domains) {
    const uris = domains[prefix]
    promises.push(getters[prefix](uris, params))
  }

  return Promise.all(promises)
}

const formatList = results => flatMap(results, 'entities')

const formatRichResults = results => {
  const response = {
    // entities are a array until they are indexed by uri hereafter
    entities: [],
    // collect redirections at the response root to let the possibility
    // to the client to alias entities
    redirects: {},
    notFound: [],
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

  response.entities = keyBy(response.entities, 'uri')

  if (response.notFound.length === 0) delete response.notFound

  return response
}

const validators = {
  inv: isInvEntityId,
  wd: isWdEntityId,
  isbn: isValidIsbn,
}
