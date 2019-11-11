// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const getBestLangValue = __.require('lib', 'get_best_lang_value')

module.exports = lang => (function(results) {
  if (!lang) { return results }

  return results
  .map((result) => {
    const { _type, _source } = result
    return formatters[_type](result, _source, lang)
  })
})

const entityFormatter = (result, _source, lang) => ({
  id: result._id,
  type: result._type,
  uri: getUri(result._index, result._id),
  label: getBestLangValue(lang, null, _source.labels).value,
  description: __guard__(getBestLangValue(lang, null, _source.descriptions).value, x => x.slice(0, 201)),
  image: getBestLangValue(lang, null, _source.images).value,
  lexicalScore: result._score
})

var getUri = function(index, id){ if (index === 'wikidata') { return `wd:${id}` } else { return `inv:${id}` } }

const networkFormatter = (labelAttr, descAttr) => (result, _source, lang) => ({
  id: result._id,
  type: result._type,
  label: _source[labelAttr],
  description: __guard__(_source[descAttr], x => x.slice(0, 201)),
  image: _source.picture,
  lexicalScore: result._score
})

var formatters = {
  works: entityFormatter,
  humans: entityFormatter,
  series: entityFormatter,
  publishers: entityFormatter,
  genres: entityFormatter,
  movements: entityFormatter,
  collections: entityFormatter,
  users: networkFormatter('username', 'bio'),
  groups: networkFormatter('name', 'description')
}

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined
}