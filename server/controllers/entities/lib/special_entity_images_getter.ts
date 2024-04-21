import { map } from 'lodash-es'
import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import { isLang } from '#lib/boolean_validations'
import getOriginalLang from '#lib/wikidata/get_original_lang'
import getEntityImagesFromClaims from './get_entity_images_from_claims.js'
import getSerieParts from './get_serie_parts.js'

export default {
  // Works images (wdt:P18) in Wikidata aren't satisfying, as not making use
  // of the right to fair-use, thus the need to fetch editions covers instead
  work: (entity, limitPerLang = 1) => {
    const { uri } = entity
    const images = { claims: getEntityImagesFromClaims(entity) }
    return getWorkImagesFromEditions(uri, images, limitPerLang)
  },

  // Idem
  serie: async entity => {
    const { uri } = entity
    const images = { claims: getEntityImagesFromClaims(entity) }
    const { parts } = await getSerieParts({
      uri,
      // Do not use cached relations, to break the loop between entitiesIndexationWorker
      // and addWdEntityToIndexationQueue
      // This loop can be observed by removing the following flag, and running the test
      // 'temporarily cache relations' > 'should check the primary data'
      useCacheRelations: false,
    })
    const worksUris = map(parts, 'uri')
    const worksImages = await Promise.all(worksUris.map(getOneWorkImagePerLang))
    return worksImages.reduce(aggregateWorkImages, images)
  },

  collection: async entity => {
    const images = { claims: getEntityImagesFromClaims(entity) }
    return getInvEntitiesByClaim('wdt:P195', entity.uri, true, true)
    .then(addEditionsImages(images))
  },
}

function getWorkImagesFromEditions (workUri, images, limitPerLang) {
  return getInvEntitiesByClaim('wdt:P629', workUri, true, true)
  .then(addEditionsImages(images, limitPerLang))
}

const addEditionsImages = (images, limitPerLang = 3) => editions => {
  editions.sort((a, b) => getEditionImagePreferrability(b) - getEditionImagePreferrability(a))
  for (const edition of editions) {
    const { claims } = edition
    const lang = getOriginalLang(claims)
    const image = claims['invp:P2'] && claims['invp:P2'][0]
    if (lang && image) addImage(images, lang, limitPerLang, image)
  }
  return images
}

// TODO: take edition popularity into account
function getEditionImagePreferrability (edition) {
  const numberOfWorks = edition.claims['wdt:P629'].length
  return -numberOfWorks
}

function getOneWorkImagePerLang (workUri) {
  return getWorkImagesFromEditions(workUri, {}, 1)
}

function aggregateWorkImages (images, workImages) {
  for (const [ key, values ] of Object.entries(workImages)) {
    // Ignore work claims images
    if (isLang(key)) addImage(images, key, 6, values[0])
  }
  return images
}

function addImage (images, lang, limitPerLang, image) {
  if (!images[lang]) { images[lang] = [] }
  if (images[lang].length >= limitPerLang) return
  // Prevent duplicates that could be caused by multi-works editions
  // Where several work consider having the same edition and thus
  // would here return the same image.
  // Multi-work editions images shouldn't be discarded as they often
  // are actually better non-work specific illustrations of series
  // ex: https://inventaire.io/entity/isbn:9782302019249
  if (images[lang].includes(image)) return
  // Index images by language so that we can illustrate a work
  // with the cover from an edition of the user's language
  // when possible
  images[lang].push(image)
}
