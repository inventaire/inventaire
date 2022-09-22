const { pick } = require('lodash')
const getBestLangValue = require('lib/get_best_lang_value')
const getOriginalLang = require('lib/wikidata/get_original_lang')

const pickAttributes = (entities, attributes) => {
  const formattedEntities = {}
  for (const uri of Object.keys(entities)) {
    const entity = entities[uri]
    const formattedEntity = {
      uri,
      ...pick(entity, attributes)
    }
    formattedEntities[uri] = formattedEntity
  }
  return formattedEntities
}

const pickLanguages = (entities, lang) => {
  const formattedEntities = {}
  for (const uri of Object.keys(entities)) {
    const entity = entities[uri]
    const originalLang = getOriginalLang(entity.claims)
    pickAttributesLanguages(lang, originalLang, entity)
    formattedEntities[uri] = entity
  }
  return formattedEntities
}

const pickAttributesLanguages = (lang, originalLang, formattedEntity) => {
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

module.exports = {
  pickAttributes,
  pickLanguages,
}
