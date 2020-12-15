const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const typeSearch = __.require('controllers', 'search/lib/type_search')
const getBestLangValue = __.require('lib', 'get_best_lang_value')
const getEntitiesByUris = require('../get_entities_by_uris')
const workEntitiesCache = require('./work_entity_search_deduplicating_cache')
const { matchTitle, matchAuthor } = require('./work_entity_search_utils')

// Search an existing work by title and authors from a seed
// to avoid creating duplicates if a corresponding work already exists
module.exports = async seed => {
  const { title, authors, groupLang } = seed
  // Unless a lang is explicitly passed, deduce it from the the ISBN groupLang
  const lang = seed.lang || groupLang

  const validAuthors = _.isArray(authors) && _.every(authors, _.isNonEmptyString)
  if (!_.isNonEmptyString(title) || !validAuthors) {
    _.warn(seed, 'unsufficient seed data to search a pre-existing work entity')
    return
  }

  const cachedWorkPromise = workEntitiesCache.get(seed)
  if (cachedWorkPromise != null) return cachedWorkPromise

  const results = await typeSearch({ search: title, types: [ 'works' ], lang })
  const uris = results.map(result => result._source.uri)
  let entities = await getEntitiesByUris({ uris, list: true })

  entities = entities
    .filter(matchTitle(title, lang))

  // Fetch the data we miss to check author match
  // Filter the remaining results on authors
  await Promise.all(entities.map(addAuthorsStrings(lang)))

  const matches = entities.filter(matchAuthor(authors, lang))
  if (matches.length > 1) _.warn(matches, 'possible duplicates')
  return matches[0]
}

const addAuthorsStrings = lang => result => {
  const authorsUris = result.claims['wdt:P50']
  if (!(authorsUris && authorsUris.length > 0)) {
    _.warn(result, 'no authors to add')
    result.authors = []
    return result
  }

  return getEntitiesByUris({ uris: authorsUris })
  .then(parseAuthorsStrings(lang))
  .then(authorsStrings => {
    result.authors = authorsStrings
    return result
  })
}

const parseAuthorsStrings = lang => res => {
  return _.values(res.entities)
  .map(authorEntity => {
    const { originalLang, labels } = authorEntity
    return getBestLangValue(lang, originalLang, labels).value
  })
}
