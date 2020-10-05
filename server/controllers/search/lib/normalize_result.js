const CONFIG = require('config')
const __ = CONFIG.universalPath
const getBestLangValue = __.require('lib', 'get_best_lang_value')

module.exports = lang => result => {
  if (!lang) return result
  const { _source } = result
  _source.type = _source.type.concat('s')
  const { type } = _source
  return formatters[type](result, _source, lang)
}

const entityFormatter = (result, _source, lang) => ({
  id: result._id,
  type: _source.type,
  uri: getUri(result._index, result._id),
  label: getBestLangValue(lang, null, _source.labels).value,
  description: getShortDescription(_source.descriptions, lang),
  image: getBestLangValue(lang, null, _source.images).value,
  lexicalScore: result._score
})

const getShortDescription = (descriptions, lang) => {
  const { value } = getBestLangValue(lang, null, descriptions)
  if (value) return value.slice(0, 200)
}

const getUri = (index, id) => index === 'wikidata' ? `wd:${id}` : `inv:${id}`

const networkFormatter = (labelAttr, descAttr) => (result, _source, lang) => ({
  id: result._id,
  type: _source.type,
  label: _source[labelAttr],
  description: _source[descAttr] && _source[descAttr].slice(0, 200),
  image: _source.picture,
  lexicalScore: result._score
})

const formatters = {
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
