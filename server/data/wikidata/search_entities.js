
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const wikidataSearch = __.require('lib', 'wikidata/search')
const requests_ = __.require('lib', 'requests')
const cache_ = __.require('lib', 'cache')
const assert_ = __.require('utils', 'assert_types')
const qs = require('querystring')

module.exports = query => {
  const { search, refresh } = query
  assert_.string(search)
  const key = `wd:search:${search}`
  return cache_.get({ key, fn: searchEntities.bind(null, search), refresh })
}

const searchEntities = search => {
  search = qs.escape(search)
  const url = wikidataSearch(search)
  _.log(url, 'searchEntities')

  return requests_.get(url)
  .then(extractWdIds)
  .then(_.Success('wd ids found'))
}

const extractWdIds = res => res.query.search.map(_.property('title'))
