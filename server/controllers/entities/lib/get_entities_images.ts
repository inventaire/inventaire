import { mapValues } from 'lodash-es'
import { normalizeEntityImagePath } from '#controllers/search/lib/normalize_result'
import { objectPromise } from '#lib/promises'
import { objectEntries } from '#lib/utils/base'
import type { EntityUri, SerializedEntitiesByUris, SerializedEntity, WikimediaCommonsFilename } from '#server/types/entity'
import type { EntityImagePath } from '#server/types/image'
import { getEntitiesByUris } from './get_entities_by_uris.js'
import { getEntityImagesFromClaims } from './get_entity_images_from_claims.js'
import specialEntityImagesGetter from './special_entity_images_getter.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

export default async function (uris: EntityUri[], refresh = false) {
  const { entities } = await getEntitiesByUris({ uris, refresh })
  return getEntitiesImages(entities)
}

function getEntitiesImages (entities: SerializedEntitiesByUris) {
  return objectPromise(mapValues(entities, getEntityImage))
}

type EntityImagesByLang = Partial<Record<WikimediaLanguageCode | 'claims', (EntityImagePath | WikimediaCommonsFilename)[]>>

async function getEntityImage (entity: SerializedEntity): Promise<EntityImagesByLang> {
  if (specialEntityImagesGetter[entity.type]) {
    const imagesByLang: EntityImagesByLang = await specialEntityImagesGetter[entity.type](entity)
    for (const [ lang, images ] of objectEntries(imagesByLang)) {
      imagesByLang[lang] = images.map(normalizeEntityImagePath)
    }
    return imagesByLang as EntityImagesByLang
  } else {
    return defaultEntityImageGetter(entity)
  }
}

function defaultEntityImageGetter (entity: SerializedEntity) {
  return {
    claims: getEntityImagesFromClaims(entity),
  }
}
