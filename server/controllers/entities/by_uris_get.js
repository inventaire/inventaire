import { addEntitiesPopularities } from '#controllers/entities/lib/popularity'
import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties_per_type'
import addRelatives from './lib/add_relatives.js'
import getEntitiesByUris from './lib/get_entities_by_uris.js'
import { pickAttributes, pickLanguages } from './lib/pick_attributes.js'

const sanitization = {
  uris: {},
  attributes: {
    allowlist: [
      'info',
      'labels',
      'descriptions',
      'claims',
      'sitelinks',
      'image',
      'popularity',
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
    allowlist: authorRelationsProperties.concat([
      'wdt:P179', // part of the series
      'wdt:P629', // edition or translation of
    ]),
    optional: true,
  },
}

const controller = async ({ uris, attributes, lang, refresh, relatives, autocreate }) => {
  let results = await getEntitiesByUris({ uris, refresh, autocreate })
  if (relatives) results = await addRelatives(results, relatives, refresh)
  if (attributes) {
    results.entities = pickAttributes(results.entities, attributes)
    if (attributes.includes('popularity')) {
      await addEntitiesPopularities({
        entities: Object.values(results.entities),
        refresh,
      })
    }
  }
  if (lang) results.entities = pickLanguages(results.entities, lang)
  return results
}

export default { sanitization, controller }
