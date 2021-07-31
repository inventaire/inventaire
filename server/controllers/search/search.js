const normalizeResult = require('./lib/normalize_result')
const { indexedTypes } = require('./lib/indexes')
const typeSearch = require('./lib/type_search')
const Group = require('models/group')
const { ControllerWrapper } = require('lib/controller_wrapper')

const sanitization = {
  search: {},
  lang: {},
  types: { allowlist: indexedTypes },
  limit: { default: 10, max: 100 },
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
  }
}

const search = async ({ types, search, lang, limit, filter, exact, minScore, reqUserId }) => {
  let results = await typeSearch({ lang, types, search, limit, filter, exact, minScore })
  results = results
    .filter(isSearchable(reqUserId))
    .map(normalizeResult(lang))
    .slice(0, limit)
  return { results }
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
    controller: search,
  })
}
