const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const normalizeResult = require('./lib/normalize_result')
const { indexedTypes } = require('./lib/indexes')
const typeSearch = require('./lib/type_search')
const { sanitizeAsync } = require('lib/sanitize/sanitize')
const Group = require('models/group')

const sanitization = {
  search: {
    optional: true
  },
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
  },
  claim: {
    generic: 'string',
    optional: true
  }
}

module.exports = {
  get: (req, res) => {
    sanitizeAsync(req, res, sanitization)
    .then(search)
    .then(responses_.Wrap(res, 'results'))
    .catch(error_.Handler(req, res))
  }
}

const search = async ({ types, search, lang, limit, filter, exact, minScore, claim, reqUserId }) => {
  if (!(_.isNonEmptyString(search) || _.isNonEmptyString(claim))) {
    throw error_.newMissing('query', 'search or claim')
  }

  const results = await typeSearch({ lang, types, search, limit, filter, exact, minScore, claim })
  return results
  .filter(isSearchable(reqUserId))
  .map(normalizeResult(lang))
  .slice(0, limit)
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
