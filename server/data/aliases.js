const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { typesAliases, typesNames } = __.require('lib', 'wikidata/aliases')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')
const getBestLangValue = __.require('lib', 'get_best_lang_value')
const { unprefixify } = __.require('controllers', 'entities/lib/prefix')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  type: {
    whitelist: typesNames
  },
  lang: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { type } = params
    let { lang } = params
    if (!lang) { lang = 'en' }
    const aliasesUris = typesAliases[type]
    return getEntitiesByUris({ uris: aliasesUris })
    .then(resp => {
      const entityLabels = _.mapValues(resp.entities, getBestLangValuePerEntity(lang))
      const aliases = arrayifyingLabels(entityLabels)
      res.json(aliases)
    })
  })
  .catch(error_.Handler(req, res))
}

const arrayifyingLabels = entityLabels => {
  // so that output looks like :
  // [ {
  //   uri: 'wd:Q571',
  //   label: 'livre',
  //   id: 'Q571'
  // } ]
  const entityUris = Object.keys(entityLabels)
  entityUris.map(entityUri => {
    const alias = entityLabels[entityUri]
    alias.uri = entityUri
    alias.id = unprefixify(entityUri)
    alias.label = alias.value
    delete alias.value
    delete alias.lang
  })
  return Object.values(entityLabels)
}

const getBestLangValuePerEntity = lang => entity => {
  const { originalLang, labels } = entity
  return getBestLangValue(lang, originalLang, labels)
}
