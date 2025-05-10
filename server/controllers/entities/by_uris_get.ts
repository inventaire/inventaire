import { addEntitiesPopularities } from '#controllers/entities/lib/popularity'
import { workAuthorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import type { EntityUri } from '#types/entity'
import { addRelatives } from './lib/add_relatives.js'
import { getPossiblyExpandedEntitiesByUris } from './lib/get_entities_by_uris.js'
import { entitiesAttributes, pickAttributes, pickLanguages } from './lib/pick_attributes.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

const sanitization = {
  uris: {},
  attributes: {
    allowlist: entitiesAttributes,
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
      ...workAuthorRelationsProperties,
      'wdt:P179', // part of the series
      'wdt:P629', // edition or translation of
    ] as const,
    optional: true,
  },
} as const

export interface GetEntitiesParams {
  uris: EntityUri[]
  attributes?: readonly (typeof sanitization.attributes.allowlist[number])[]
  lang?: WikimediaLanguageCode
  refresh?: boolean
  autocreate?: boolean
  relatives?: readonly (typeof sanitization.relatives.allowlist[number])[]
}

async function controller ({ uris, attributes, lang, refresh, relatives, autocreate }: GetEntitiesParams) {
  const includeReferences = attributes?.includes('references')
  let results = await getPossiblyExpandedEntitiesByUris({ uris, refresh, autocreate, includeReferences })
  // @ts-expect-error
  if (relatives) results = await addRelatives(results, relatives, refresh)
  if (attributes) {
    // @ts-expect-error
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

export type GetEntitiesByUrisResponse = Awaited<ReturnType<typeof controller>>
