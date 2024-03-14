import { keyBy } from 'lodash-es'
import { isInvEntityId, isWdEntityId } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { isValidIsbn } from '#lib/isbn/isbn'
import { assert_ } from '#lib/utils/assert_types'
import type { EntityUri, SerializedEntitiesByUris } from '#types/entity'
import { getEntitiesByIsbns } from './get_entities_by_isbns.js'
import { getInvEntitiesByIds } from './get_inv_entities.js'
import { getWikidataEnrichedEntities } from './get_wikidata_enriched_entities.js'

// Getters take ids, return an object on the model { entities: [], notFound }
const getters = {
  inv: getInvEntitiesByIds,
  wd: getWikidataEnrichedEntities,
  isbn: getEntitiesByIsbns,
}

const prefixes = Object.keys(getters)

export interface EntitiesGetterArgs {
  refresh?: boolean
  dry?: boolean
  autocreate?: boolean
}

export interface GetEntitiesByUrisArgs extends EntitiesGetterArgs {
  uris: EntityUri[]
}

export async function getEntitiesByUris (params: GetEntitiesByUrisArgs) {
  const { uris } = params
  assert_.array(uris)
  const domains = {}

  // validate per URI to be able to return a precise error message
  for (const uri of uris) {
    let errMessage
    const [ prefix, id ] = uri.split(':')

    if (!prefixes.includes(prefix)) {
      errMessage = `invalid uri prefix: ${prefix} (uri: ${uri})`
      throw newError(errMessage, 400, { uri })
    }

    if (!validators[prefix](id)) {
      errMessage = `invalid uri id: ${id} (uri: ${uri})`
      throw newError(errMessage, 400, { uri })
    }

    if (!domains[prefix]) { domains[prefix] = [] }
    domains[prefix].push(id)
  }

  const results = await getDomainsPromises(domains, params)
  return formatRichResults(results)
}

function getDomainsPromises (domains, params) {
  const promises = []

  for (const prefix in domains) {
    const ids = domains[prefix]
    promises.push(getters[prefix](ids, params))
  }

  return Promise.all(promises)
}

export interface EntitiesByUrisResults {
  entities: SerializedEntitiesByUris
  redirects: Record<EntityUri, EntityUri>
  notFound?: EntityUri[]
}

function formatRichResults (results) {
  const response: EntitiesByUrisResults = {
    // entities are a array until they are indexed by uri hereafter
    entities: {},
    // collect redirections at the response root to let the possibility
    // to the client to alias entities
    redirects: {},
    notFound: [],
  }

  let entitiesList = []

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
    entitiesList = entitiesList.concat(result.entities)

    // Concat the list of not found URIs
    if (result.notFound) {
      response.notFound = response.notFound.concat(result.notFound)
    }
  }

  response.entities = keyBy(entitiesList, 'uri')

  if (response.notFound.length === 0) delete response.notFound

  return response
}

const validators = {
  inv: isInvEntityId,
  wd: isWdEntityId,
  isbn: isValidIsbn,
}
