const getEntitiesByUris = require('./lib/get_entities_by_uris')
const addRelatives = require('./lib/add_relatives')
const { pickAttributes, pickLanguages } = require('./lib/pick_attributes')

const sanitization = {
  uris: {},
  attributes: {
    allowlist: [
      'type',
      'labels',
      'descriptions',
      'claims',
      'sitelinks',
      'image',
      'originalLang',
    ],
    optional: true
  },
  lang: {
    optional: true
  },
  refresh: { optional: true },
  autocreate: {
    generic: 'boolean',
    optional: true,
    default: false
  },
  relatives: {
    allowlist: [
      'wdt:P50',
      'wdt:P179',
      'wdt:P629',
    ],
    optional: true
  }
}

const controller = async ({ uris, attributes, lang, refresh, relatives, autocreate }) => {
  let results = await getEntitiesByUris({ uris, refresh, autocreate })
  if (relatives) results = await addRelatives(results, relatives, refresh)
  if (attributes) results.entities = pickAttributes(results.entities, attributes)
  if (lang) results.entities = pickLanguages(results.entities, lang)
  return results
}

module.exports = { sanitization, controller }
