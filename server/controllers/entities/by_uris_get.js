import addRelatives from './lib/add_relatives.js'
import getEntitiesByUris from './lib/get_entities_by_uris.js'
import { pickAttributes, pickLanguages } from './lib/pick_attributes.js'

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
    optional: true,
  },
  lang: {
    optional: true,
    // Default to returning attributes in all languages
    default: null,
  },
  refresh: { optional: true },
  autocreate: {
    generic: 'boolean',
    optional: true,
    default: false,
  },
  relatives: {
    allowlist: [
      'wdt:P50',
      'wdt:P179',
      'wdt:P629',
    ],
    optional: true,
  },
}

const controller = async ({ uris, attributes, lang, refresh, relatives, autocreate }) => {
  let results = await getEntitiesByUris({ uris, refresh, autocreate })
  if (relatives) results = await addRelatives(results, relatives, refresh)
  if (attributes) results.entities = pickAttributes(results.entities, attributes)
  if (lang) results.entities = pickLanguages(results.entities, lang)
  return results
}

export default { sanitization, controller }
