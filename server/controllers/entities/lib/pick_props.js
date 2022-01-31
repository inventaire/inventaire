const { pick } = require('lodash')

module.exports = (entities, props) => {
  const formattedEntities = {}
  for (const key of Object.keys(entities)) {
    const entity = entities[key]
    formattedEntities[key] = {
      uri: entity.uri,
      ...pick(entity, props)
    }
  }
  return formattedEntities
}
