const _ = require('builders/utils')
const error_ = require('lib/error/error')
const allowlistedEntityTypes = [ 'edition', 'work' ]

let getEntityByUri, shelves_
const requireCircularDependencies = () => {
  getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
  shelves_ = require('controllers/shelves/lib/shelves')
}
setImmediate(requireCircularDependencies)

const validateEntityAndShelves = async (userId, item) => {
  await Promise.all([
    validateEntity(item),
    validateShelves(userId, item.shelves),
  ])
  .catch(err => {
    error_.addContext(err, { userId, item })
    throw err
  })
}

const validateEntity = async item => {
  const entity = await getEntityByUri({ uri: item.entity })
  validateEntityType(entity, item)
}

const validateShelves = async (userId, shelvesIds) => {
  const shelves = await shelves_.byIds(shelvesIds)
  validateShelvesOwnership(userId, shelves)
}

const validateShelvesOwnership = (userId, shelves) => {
  if (_.isNonEmptyArray(shelves)) {
    const shelvesOwners = shelves.map(_.property('owner'))
    const allShelvesBelongToUser = _.uniq(shelvesOwners)[0] === userId

    if (!allShelvesBelongToUser) {
      throw error_.new('invalid owner', 400, { userId })
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

module.exports = {
  validateEntityAndShelves,
  validateShelves,
}
