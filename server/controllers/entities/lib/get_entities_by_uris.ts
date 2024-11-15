import { keyBy } from 'lodash-es'
import { isInvEntityId, isWdEntityId } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { isValidIsbn } from '#lib/isbn/isbn'
import { assert_ } from '#lib/utils/assert_types'
import { arrayIncludes, objectEntries } from '#lib/utils/base'
import { objectKeys } from '#lib/utils/types'
import type { EntityId, EntityUri, EntityUriPrefix, ExpandedSerializedEntitiesByUris, InvEntityId, Isbn, SerializedEntitiesByUris, WdEntityId } from '#types/entity'
import { getEntitiesByIsbns } from './get_entities_by_isbns.js'
import { getInvEntitiesByIds } from './get_inv_entities.js'
import { getWikidataEnrichedEntities } from './get_wikidata_enriched_entities.js'
import type { OverrideProperties, Split } from 'type-fest'

const validators = {
  inv: isInvEntityId,
  wd: isWdEntityId,
  isbn: isValidIsbn,
} as const

const prefixes = objectKeys(validators)

export interface EntitiesGetterParams {
  refresh?: boolean
  dry?: boolean
  autocreate?: boolean
  includeReferences?: boolean
}

export interface GetEntitiesByUrisParams extends EntitiesGetterParams {
  uris: EntityUri[]
}

type Domains = Partial<Record<EntityUriPrefix, EntityId[]>>

export type Redirects = Record<EntityUri, EntityUri>

export interface EntitiesByUrisResults {
  entities: SerializedEntitiesByUris
  redirects: Redirects
  notFound?: EntityUri[]
}

export type ExpandedEntitiesByUrisResults = OverrideProperties<EntitiesByUrisResults, { entities: ExpandedSerializedEntitiesByUris }>

// Using functions with forced type output as TS can't deduce the type of `entities` from the `includeReferences` flag
export async function getEntitiesByUris (params: Omit<GetEntitiesByUrisParams, 'includeReferences'>) {
  return getPossiblyExpandedEntitiesByUris({ ...params, includeReferences: false }) as Promise<EntitiesByUrisResults>
}
export async function getExpandedEntitiesByUris (params: Omit<GetEntitiesByUrisParams, 'includeReferences'>) {
  return getPossiblyExpandedEntitiesByUris({ ...params, includeReferences: true }) as Promise<ExpandedEntitiesByUrisResults>
}

export async function getPossiblyExpandedEntitiesByUris (params: GetEntitiesByUrisParams) {
  const { uris, includeReferences } = params
  assert_.array(uris)
  const domains: Domains = {}

  // validate per URI to be able to return a precise error message
  for (const uri of uris) {
    let errMessage
    const [ prefix, id ] = uri.split(':') as Split<typeof uri, ':'>

    if (!arrayIncludes(prefixes, prefix)) {
      errMessage = `invalid uri prefix: ${prefix} (uri: ${uri})`
      throw newError(errMessage, 400, { uri })
    }

    if (!validators[prefix](id)) {
      errMessage = `invalid uri id: ${id} (uri: ${uri})`
      throw newError(errMessage, 400, { uri })
    }

    domains[prefix] ??= []
    domains[prefix].push(id)
  }

  const results = await getDomainsPromises(domains, params)
  const response = formatRichResults(results, { includeReferences })
  if (includeReferences) {
    // @ts-expect-error
    return response as ExpandedEntitiesByUrisResults
  } else {
    return response as EntitiesByUrisResults
  }
}

function getDomainsPromises (domains: Domains, params: EntitiesGetterParams) {
  return Promise.all(objectEntries(domains).map(([ prefix, ids ]) => {
    if (prefix === 'wd') return getWikidataEnrichedEntities(ids as WdEntityId[], params)
    if (prefix === 'inv') return getInvEntitiesByIds(ids as InvEntityId[], params)
    if (prefix === 'isbn') return getEntitiesByIsbns(ids as Isbn[], params)
    throw newError('unsupported prefix', 500, { prefix, ids })
  }))
}

type DomainsResults = Awaited<ReturnType<typeof getDomainsPromises>>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatRichResults (results: DomainsResults, { includeReferences = false }) {
  const response = {
    // entities are a array until they are indexed by uri hereafter
    entities: {},
    // collect redirections at the response root to let the possibility
    // to the client to alias entities
    redirects: {},
    notFound: [],
  } as (typeof includeReferences extends true ? ExpandedEntitiesByUrisResults : EntitiesByUrisResults)

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
