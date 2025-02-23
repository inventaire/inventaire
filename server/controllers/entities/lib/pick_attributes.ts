import { pick } from 'lodash-es'
import { getBestLangValue } from '#lib/get_best_lang_value'
import { objectEntries } from '#lib/utils/base'
import { getOriginalLang } from '#lib/wikidata/get_original_lang'
import type { SerializedEntitiesByUris } from '#types/entity'

export const entitiesAttributes = [
  'info',
  'labels',
  'descriptions',
  'claims',
  'references',
  'sitelinks',
  'image',
  'popularity',
] as const

// Required by getEntityRevisionId (server/lib/federation/entities_revisions_cache.ts) for requests in federated mode
const mandatoryAttributes = [
  '_rev',
  'lastrevid',
  'invRev',
] as const

const infoAttributes = [
  'type',
  'created',
  'updated',
  'version',
  'originalLang',
] as const

type Attribute = typeof entitiesAttributes[number] | typeof mandatoryAttributes[number] | typeof infoAttributes[number]

export function pickAttributes (entities: SerializedEntitiesByUris, attributes: Attribute[]) {
  if (attributes.includes('info')) {
    attributes = [ ...mandatoryAttributes, ...infoAttributes, ...attributes ]
  } else {
    attributes = [ ...mandatoryAttributes, ...attributes ]
  }
  const formattedEntities = {}
  for (const [ uri, entity ] of objectEntries(entities)) {
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
