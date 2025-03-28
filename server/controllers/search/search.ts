import { map } from 'lodash-es'
import { indexedTypes, socialTypes } from '#db/elasticsearch/indexes'
import { isNonEmptyString } from '#lib/boolean_validations'
import { controllerWrapperFactory } from '#lib/controller_wrapper'
import { newMissingError } from '#lib/error/pre_filled'
import { addWarning } from '#lib/responses'
import { someMatch } from '#lib/utils/base'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import { userIsGroupMember } from '#models/group'
import type { ControllerInputSanitization } from '#types/controllers_input_sanitization'
import type { IndexedTypes } from '#types/search'
import type { Req, Res, Sanitized } from '#types/server'
import type { UserId } from '#types/user'
import normalizeResult from './lib/normalize_result.js'
import { typeSearch } from './lib/type_search.js'

const sanitization = {
  search: {
    optional: true,
  },
  lang: {},
  types: { allowlist: indexedTypes },
  limit: { default: 10, max: 100 },
  offset: { default: 0, max: 500 },
  filter: {
    allowlist: [ 'wd', 'inv' ],
    optional: true,
  },
  exact: {
    generic: 'boolean',
    optional: true,
    default: false,
  },
  'min-score': {
    generic: 'positiveInteger',
    optional: true,
  },
  claim: {
    generic: 'string',
    optional: true,
  },
} satisfies ControllerInputSanitization

export interface SearchParams {
  search: string
  lang?: string
  types?: IndexedTypes
  limit?: number
  offset?: number
  filter?: 'wd' | 'inv'
  exact?: boolean
  'min-score'?: number
  claim?: string
}

async function controller (params: Sanitized<SearchParams>, req: Req, res: Res) {
  const { types, search, claim } = params
  if (!(isNonEmptyString(search) || isNonEmptyString(claim))) {
    throw newMissingError('query', 'search or claim')
  }

  const useSocialSearch = someMatch(socialTypes, types)

  if (useSocialSearch) {
    return socialSearch(params, res)
  } else {
    return entitiesSearch(params)
  }
}

async function socialSearch (params: Sanitized<SearchParams>, res: Res) {
  const { search, lang, limit, offset, reqUserId } = params

  if (!(isNonEmptyString(search))) {
    throw newMissingError('query', 'search')
  }

  if (offset !== 0) {
    addWarning(res, 'the offset parameter is ignored on user and group search')
  }

  const { hits } = await typeSearch(params)

  // Shelves and listings visibility checks need async ops,
  // which can not be done in isSearchable
  let results = await removeUnauthorizedDocs(hits, reqUserId)

  results = results
    .filter(isSearchable(reqUserId))
    .map(normalizeResult(lang))
    .slice(0, limit)

  return { results }
}

async function entitiesSearch (params: Sanitized<SearchParams>) {
  const { search, lang, limit, offset, claim } = params

  if (!(isNonEmptyString(search) || isNonEmptyString(claim))) {
    throw newMissingError('query', 'search or claim')
  }

  const { hits, total } = await typeSearch(params)
  const continu = limit + offset
  return {
    results: hits.map(normalizeResult(lang)),
    total,
    continue: continu < total ? continu : undefined,
  }
}

const isSearchable = (reqUserId: UserId) => result => {
  const source = result._source
  if (source.type === 'user') {
    return source.deleted !== true
  } else if (source.type === 'group') {
    if (source.searchable) return true
    if (reqUserId == null) return false
    // Only members should be allowed to find non-searchable groups in search
    return userIsGroupMember(reqUserId, source)
  } else {
    return true
  }
}

const typesWithVisibility = [ 'shelf', 'list' ]

async function removeUnauthorizedDocs (results, reqUserId) {
  const docsRequiringAuthorization = results
    .filter(result => typesWithVisibility.includes(result._source.type))
    .map(({ _id, _source }) => ({ _id, ..._source }))
  const authorizedDocs = await filterVisibleDocs(docsRequiringAuthorization, reqUserId)
  const authorizedDocsIds = map(authorizedDocs, '_id')
  return results.filter(result => {
    if (typesWithVisibility.includes(result._source.type)) {
      return authorizedDocsIds.includes(result._id)
    } else {
      return true
    }
  })
}

export default {
  get: controllerWrapperFactory({
    access: 'public',
    sanitization,
    controller,
  }),
}
