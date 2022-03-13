const _ = require('builders/utils')
const error_ = require('lib/error/error')
const normalizeResult = require('./lib/normalize_result')
const { indexedTypes } = require('db/elasticsearch/indexes')
const typeSearch = require('./lib/type_search')
const Group = require('models/group')
const { ControllerWrapper } = require('lib/controller_wrapper')
const { addWarning } = require('lib/responses')

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

  const useSocialSearch = types.includes('users') || types.includes('groups')

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

  const results = hits
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

module.exports = {
  get: ControllerWrapper({
    access: 'public',
    sanitization,
    controller,
  })
}
