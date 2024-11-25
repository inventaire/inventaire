import { pick } from 'lodash-es'
import { getBestLangValue } from '#lib/get_best_lang_value'
import { getOriginalLang } from '#lib/wikidata/get_original_lang'

const infoAttributes = [
  '_id',
  '_rev',
  'type',
  'created',
  'updated',
  'version',
  'originalLang',
]

export function pickAttributes (entities, attributes) {
  if (attributes.includes('info')) {
    attributes = infoAttributes.concat(attributes)
  }
  const formattedEntities = {}
  for (const uri of Object.keys(entities)) {
    const entity = entities[uri]
    const formattedEntity = {
      uri,
      ...pick(entity, attributes),
    }
    formattedEntities[uri] = formattedEntity
  }
  return formattedEntities
}

export function pickLanguages (entities, lang) {
  const formattedEntities = {}
  for (const uri of Object.keys(entities)) {
    const entity = entities[uri]
    const originalLang = getOriginalLang(entity.claims)
    pickAttributesLanguages(lang, originalLang, entity)
    formattedEntities[uri] = entity
  }
  return formattedEntities
}

function pickAttributesLanguages (lang, originalLang, formattedEntity) {
  if (formattedEntity.labels) {
    formattedEntity.labels = pickLanguage(lang, originalLang, formattedEntity.labels)
  }
  if (formattedEntity.descriptions) {
    formattedEntity.descriptions = pickLanguage(lang, originalLang, formattedEntity.descriptions)
  }
  if (formattedEntity.aliases) {
    formattedEntity.aliases = pickLanguage(lang, originalLang, formattedEntity.aliases)
  }
}

function pickLanguage (lang, originalLang, data) {
  const { lang: pickedLang, value } = getBestLangValue(lang, originalLang, data)
  return {
    [pickedLang]: value,
  }
}
