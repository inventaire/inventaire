const formatEntity = require('./format_entity')
const haveSpecialImagesGetter = require('./have_special_images_getter')
const addEntitiesImages = require('./add_entities_images')

module.exports = type => async entities => {
  if (!type) throw new Error('missing type')
  if (!entities) throw new Error('missing entities')

  if (haveSpecialImagesGetter.includes(type)) {
    return addEntitiesImages(entities).then(formatEntities)
  } else {
    // Images will simply be taken from claims during formatting
    return formatEntities(entities)
  }
}

const formatEntities = entities => {
  if (!(entities instanceof Array)) {
    entities = Object.values(entities)
  }

  return entities.map(formatEntity)
}
