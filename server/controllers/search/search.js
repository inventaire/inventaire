import _ from 'builders/utils'
import error_ from 'lib/error/error'
import normalizeResult from './lib/normalize_result'
import { indexedTypes, socialTypes } from 'db/elasticsearch/indexes'
import typeSearch from './lib/type_search'
import Group from 'models/group'
import { ControllerWrapper } from 'lib/controller_wrapper'
import { addWarning } from 'lib/responses'
import { someMatch } from 'lib/utils/base'
import filterVisibleDocs from 'lib/visibility/filter_visible_docs'

const sanitization = {
  search: {
    optional: true
  },
  lang: {},
  types: { allowlist: indexedTypes },
  limit: { default: 10, max: 100 },
  offset: { default: 0, max: 500 },
  filter: {
    allowlist: [ 'wd', 'inv' ],
    optional: true
  },
  exact: {
    generic: 'boolean',
    optional: true,
    default: false
  },
  'min-score': {
    generic: 'positiveInteger',
    optional: true
  },
  claim: {
    generic: 'string',
    optional: true
  }
}

const controller = async (params, req, res) => {
  const { types, search, claim } = params
  if (!(_.isNonEmptyString(search) || _.isNonEmptyString(claim))) {
    throw error_.newMissing('query', 'search or claim')
  }

  const useSocialSearch = someMatch(socialTypes, types)

  if (useSocialSearch) {
    return socialSearch(params, res)
  } else {
    return entitiesSearch(params)
  }
}

const socialSearch = async (params, res) => {
  const { search, lang, limit, offset, reqUserId } = params

  if (!(_.isNonEmptyString(search))) {
    throw error_.newMissing('query', 'search')
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

const entitiesSearch = async params => {
  const { search, lang, limit, offset, claim } = params

  if (!(_.isNonEmptyString(search) || _.isNonEmptyString(claim))) {
    throw error_.newMissing('query', 'search or claim')
  }

  const { hits, total } = await typeSearch(params)
  const continu = limit + offset
  return {
    results: hits.map(normalizeResult(lang)),
    total,
    continue: continu < total ? continu : undefined
  }
}

const isSearchable = reqUserId => result => {
  const source = result._source
  if (source.type === 'user') {
    return source.deleted !== true
  } else if (source.type === 'group') {
    if (source.searchable) return true
    if (reqUserId == null) return false
    // Only members should be allowed to find non-searchable groups in search
    return Group.userIsMember(reqUserId, source)
  } else {
    return true
  }
}

const typesWithVisibility = [ 'shelf', 'list' ]

const removeUnauthorizedDocs = async (results, reqUserId) => {
  const docsRequiringAuthorization = results
    .filter(result => typesWithVisibility.includes(result._source.type))
    .map(({ _id, _source }) => ({ _id, ..._source }))
  const authorizedDocs = await filterVisibleDocs(docsRequiringAuthorization, reqUserId)
  const authorizedDocsIds = _.map(authorizedDocs, '_id')
  return results.filter(result => {
    if (typesWithVisibility.includes(result._source.type)) {
      return authorizedDocsIds.includes(result._id)
    } else {
      return true
    }
  })
}

export default {
  get: ControllerWrapper({
    access: 'public',
    sanitization,
    controller,
  })
}
