/* eslint-disable
    prefer-const,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')

const searchByText = require('../search_by_text')
const getBestLangValue = __.require('lib', 'get_best_lang_value')
const getEntitiesByUris = require('../get_entities_by_uris')
const workEntitiesCache = require('./work_entity_search_deduplicating_cache')
const { matchTitle, matchAuthor } = require('./work_entity_search_utils')

// Search an existing work by title and authors from a seed
// to avoid creating duplicates if a corresponding work already exists
module.exports = function(seed){
  let { title, authors, lang, groupLang } = seed
  // unless a lang is explicitly passed, deduce it from the the ISBN groupLang
  if (!lang) { lang = groupLang }

  const validAuthors = _.isArray(authors) && _.every(authors, _.isNonEmptyString)
  if (!_.isNonEmptyString(title) || !validAuthors) {
    _.warn(seed, 'unsufficient seed data to search a pre-existing work entity')
    return promises_.resolve()
  }

  const cachedWorkPromise = workEntitiesCache.get(seed)
  if (cachedWorkPromise != null) return cachedWorkPromise

  return searchByText({ search: title, lang })
  .filter(isWork)
  // Make a first filter from the results we got
  .filter(matchTitle(title, lang))
  // Fetch the data we miss to check author match
  .map(AddAuthorsStrings(lang))
  // Filter the remaining results on authors
  .filter(matchAuthor(authors, lang))
  .then((matches) => {
    if (matches.length > 1) { _.warn(matches, 'possible duplicates') }
    return matches[0]})
}

var isWork = entity => entity.type === 'work'

var AddAuthorsStrings = lang => (function(result) {
  const authorsUris = result.claims['wdt:P50']
  if ((authorsUris != null ? authorsUris.length : undefined) <= 0) {
    _.warn(result, 'no authors to add')
    result.authors = []
    return result
  }

  return getEntitiesByUris({ uris: authorsUris })
  .then(ParseAuthorsStrings(lang))
  .then((authorsStrings) => {
    result.authors = authorsStrings
    return result
  })
})

var ParseAuthorsStrings = lang => res => _.values(res.entities)
.map(authorEntity => getBestLangValue(lang, authorEntity.originalLang, authorEntity.labels).value)
