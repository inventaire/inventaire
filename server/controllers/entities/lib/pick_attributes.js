const { pick } = require('lodash')
const getBestLangValue = require('lib/get_best_lang_value')
const getOriginalLang = require('lib/wikidata/get_original_lang')

module.exports = (entities, attributes, lang) => {
  const formattedEntities = {}
  for (const key of Object.keys(entities)) {
    const entity = entities[key]
    const formattedEntity = {
      uri: entity.uri,
      ...pick(entity, attributes)
    }
    if (lang != null) {
      const originalLang = getOriginalLang(entity.claims)
      pickLanguages(lang, originalLang, formattedEntity)
    }
    formattedEntities[key] = formattedEntity
  }
  return formattedEntities
}

const pickLanguages = (lang, originalLang, formattedEntity) => {
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

const pickLanguage = (lang, originalLang, data) => {
  const { lang: pickedLang, value } = getBestLangValue(lang, originalLang, data)
  return {
    [pickedLang]: value
  }
}
