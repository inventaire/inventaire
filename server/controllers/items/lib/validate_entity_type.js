const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const whitelistedEntityTypes = [ 'edition', 'work' ]

// Working around the circular dependency
let getEntityByUri
const lateRequire = () => {
  getEntityByUri = __.require('controllers', 'entities/lib/get_entity_by_uri')
}
setTimeout(lateRequire, 0)

module.exports = item => {
  return getEntityByUri({ uri: item.entity })
  .then(entity => {
    if (entity == null) throw error_.new('entity not found', 400, { item })

    const { type } = entity

    if (!whitelistedEntityTypes.includes(type)) {
      throw error_.new('invalid entity type', 400, { item, type })
    }

    return item
  })
}
