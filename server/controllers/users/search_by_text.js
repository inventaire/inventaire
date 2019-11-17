// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const { buildSearcher } = __.require('lib', 'elasticsearch')

module.exports = (req, res) => {
  const { query } = req
  const search = query.search != null ? query.search.trim() : undefined

  if (!_.isNonEmptyString(search)) {
    return error_.bundleInvalid(req, res, 'search', search)
  }

  return searchByText(search)
  .then(responses_.Wrap(res, 'users'))
  .catch(error_.Handler(req, res))
}

const searchByText = buildSearcher({
  dbBaseName: 'users',
  queryBodyBuilder: search => {
    const should = [
      // Username
      { match: { username: { query: search, boost: 5 } } },
      { match_phrase_prefix: { username: { query: search, boost: 4 } } },
      { fuzzy: { username: search } },
      // Bio
      { match: { bio: search } }
    ]

    return { query: { bool: { should } } }
  }
})
