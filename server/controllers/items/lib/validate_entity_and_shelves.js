const _ = require('builders/utils')
const error_ = require('lib/error/error')
const allowlistedEntityTypes = [ 'edition', 'work' ]

let getEntityByUri, shelves_
const requireCircularDependencies = () => {
  getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
  shelves_ = require('controllers/shelves/lib/shelves')
}
setImmediate(requireCircularDependencies)

module.exports = async (userId, item) => {
  const [ entity, shelves ] = await Promise.all([
    getEntityByUri({ uri: item.entity }),
    shelves_.byIds(item.shelves)
  ])
  validateShelvesOwnership(userId, shelves, item)
  validateEntityType(entity, item)
}

const validateShelvesOwnership = (userId, shelves, item) => {
  if (_.isNonEmptyArray(shelves)) {
    const shelvesOwners = shelves.map(_.property('owner'))
    const allShelvesBelongToUser = _.uniq(shelvesOwners)[0] === userId

    if (!allShelvesBelongToUser) {
      throw error_.new('invalid owner', 400, { userId, item })
    }
  }
}

const validateEntityType = (entity, item) => {
  if (entity == null) throw error_.new('entity not found', 400, { item })

  const { type } = entity

  if (!allowlistedEntityTypes.includes(type)) {
    throw error_.new('invalid entity type', 400, { item, type })
  }
}
