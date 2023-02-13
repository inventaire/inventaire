import getBestLangValue from '#lib/get_best_lang_value'

export default lang => result => {
  if (!lang) return result
  const { _source } = result
  _source.type = pluralizeType(_source.type)
  const { type } = _source
  return formatters[type](result, _source, lang)
}

const entityFormatter = (result, _source, lang) => ({
  id: result._id,
  type: _source.type,
  uri: getUri(result._id),
  label: getBestLangValue(lang, null, _source.labels).value,
  description: getShortDescription(_source.descriptions, lang),
  image: getBestLangValue(lang, null, _source.images).value,
  _score: result._score,
  _popularity: _source.popularity,
})

const getShortDescription = (descriptions, lang) => {
  const { value } = getBestLangValue(lang, null, descriptions)
  if (value) return value.slice(0, 200)
}

const getUri = id => id[0] === 'Q' ? `wd:${id}` : `inv:${id}`

const socialDocsFormatter = (labelAttr, descAttr) => (result, _source, lang) => ({
  id: result._id,
  type: _source.type,
  label: _source[labelAttr],
  description: _source[descAttr] && _source[descAttr].slice(0, 200),
  image: _source.picture,
  _score: result._score,
})

const pluralizeType = singularType => {
  if (singularType === 'shelf') return 'shelves'
  return `${singularType}s`
}

const formatters = {
  works: entityFormatter,
  humans: entityFormatter,
  series: entityFormatter,
  publishers: entityFormatter,
  genres: entityFormatter,
  movements: entityFormatter,
  collections: entityFormatter,
  languages: entityFormatter,
  users: socialDocsFormatter('username', 'bio'),
  groups: socialDocsFormatter('name', 'description'),
  shelves: socialDocsFormatter('name', 'description'),
  lists: socialDocsFormatter('name', 'description'),
}
