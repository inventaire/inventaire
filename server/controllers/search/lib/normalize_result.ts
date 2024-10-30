import { getUrlFromEntityImageHash } from '#controllers/entities/lib/entities'
import { isImageHash } from '#lib/boolean_validations'
import getBestLangValue from '#lib/get_best_lang_value'
import type { EntityImagePath, ImageHash } from '#server/types/image'

export default lang => result => {
  if (!lang) return result
  const { _source } = result
  _source.type = pluralizeType(_source.type)
  const { type } = _source
  return formatters[type](result, _source, lang)
}

function entityFormatter (result, _source, lang) {
  return {
    id: result._id,
    type: _source.type,
    uri: getUri(result._id),
    label: getBestLangValue(lang, null, _source.labels).value,
    description: getShortDescription(_source.descriptions, lang),
    image: pickFirstImageAndNormalize(getBestLangValue(lang, null, _source.images).value),
    _score: result._score,
    _popularity: _source.popularity,
  }
}

function pickFirstImageAndNormalize (image: ImageHash | EntityImagePath | (ImageHash | EntityImagePath)[]) {
  image = image instanceof Array ? image[0] : image
  if (image == null) return
  return normalizeEntityImagePath(image)
}

export function normalizeEntityImagePath (image: ImageHash | EntityImagePath) {
  if (isImageHash(image)) return getUrlFromEntityImageHash(image)
  else return image
}

function getShortDescription (descriptions, lang) {
  const { value } = getBestLangValue(lang, null, descriptions)
  if (value) return value.slice(0, 200)
}

const getUri = id => id[0] === 'Q' ? `wd:${id}` : `inv:${id}`

const socialDocsFormatter = (labelAttr, descAttr) => (result, _source) => ({
  id: result._id,
  type: _source.type,
  label: _source[labelAttr],
  description: _source[descAttr] && _source[descAttr].slice(0, 200),
  image: _source.picture,
  _score: result._score,
})

function pluralizeType (singularType) {
  if (singularType === 'shelf') return 'shelves'
  return `${singularType}s`
}

const formatters = {
  works: entityFormatter,
  humans: entityFormatter,
  series: entityFormatter,
  publishers: entityFormatter,
  collections: entityFormatter,
  genres: entityFormatter,
  movements: entityFormatter,
  languages: entityFormatter,
  users: socialDocsFormatter('username', 'bio'),
  groups: socialDocsFormatter('name', 'description'),
  shelves: socialDocsFormatter('name', 'description'),
  lists: socialDocsFormatter('name', 'description'),
}
