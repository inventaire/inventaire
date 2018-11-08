__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
getSerieParts = require './get_serie_parts'
getEntityImagesFromClaims = require './get_entity_images_from_claims'

module.exports =
  # Works images (wdt:P18) in Wikidata aren't satisfying, as not making use
  # of the right to fair-use, thus the need to fetch editions covers instead
  work: (entity, limitPerLang)->
    { uri } = entity
    images = { claims: getEntityImagesFromClaims(entity) }
    getWorkEditions uri, images, limitPerLang

  # Idem
  serie: (entity)->
    { uri } = entity
    images = { claims: getEntityImagesFromClaims(entity) }
    getSerieParts uri
    .then (res)-> _.map(res.parts, 'uri')
    .map getOneWorkImagePerLang
    .reduce aggregateWorkImages, images

getWorkEditions = (workUri, images, limitPerLang)->
  entities_.byClaim 'wdt:P629', workUri, true, true
  .then addEditionsImages(images, limitPerLang)

addEditionsImages = (images, limitPerLang = 3)-> (editions)->
  for edition in editions
    lang = getOriginalLang edition.claims
    image = edition.claims['invp:P2']?[0]
    if lang? and image? then addImage images, lang, limitPerLang, image

  return images

getOneWorkImagePerLang = (workUri)-> getWorkEditions workUri, {}, 1

aggregateWorkImages = (images, workImages)->
  for key, values of workImages
    # Ignore work claims images
    if _.isLang(key) then addImage images, key, 3, values[0]

  return images

addImage = (images, lang, limitPerLang, image)->
  images[lang] or= []
  if images[lang].length >= limitPerLang then return
  # Prevent duplicates that could be caused by multi-works editions
  # Where several work consider having the same edition and thus
  # would here return the same image.
  # Multi-work editions images shouldn't be discarded as they often
  # are actually better non-work specific illustrations of series
  # ex: https://inventaire.io/entity/isbn:9782302019249
  if image in images[lang] then return
  # Index images by language so that we can illustrate a work
  # with the cover from an edition of the user's language
  # when possible
  images[lang].push image
  return
