const _ = require('builders/utils')
const entities_ = require('./entities')
const getOriginalLang = require('lib/wikidata/get_original_lang')
const getSerieParts = require('./get_serie_parts')
const getEntityImagesFromClaims = require('./get_entity_images_from_claims')

module.exports = {
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
    const { parts } = await getSerieParts({ uri })
    const worksUris = _.map(parts, 'uri')
    const worksImages = await Promise.all(worksUris.map(getOneWorkImagePerLang))
    return worksImages.reduce(aggregateWorkImages, images)
  }
}

const getWorkImagesFromEditions = (workUri, images, limitPerLang) => {
  return entities_.byClaim('wdt:P629', workUri, true, true)
  .then(addEditionsImages(images, limitPerLang))
}

const addEditionsImages = (images, limitPerLang = 3) => editions => {
  for (const edition of editions) {
    const { claims } = edition
    const lang = getOriginalLang(claims)
    const image = claims['invp:P2'] && claims['invp:P2'][0]
    if (lang && image) addImage(images, lang, limitPerLang, image)
  }

  return images
}

const getOneWorkImagePerLang = workUri => {
  return getWorkImagesFromEditions(workUri, {}, 1)
}

const aggregateWorkImages = (images, workImages) => {
  for (const key in workImages) {
    // Ignore work claims images
    const values = workImages[key]
    if (_.isLang(key)) addImage(images, key, 3, values[0])
  }

  return images
}

const addImage = (images, lang, limitPerLang, image) => {
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
