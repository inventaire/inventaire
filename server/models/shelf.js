const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const validations = require('./validations/shelf')
const attributes = require('./attributes/shelf')
const error_ = __.require('lib', 'error/error')

module.exports = {
  create: shelf => {
    assert_.object(shelf)
    assert_.string(shelf.owner)
    assert_.string(shelf.name)

    shelf.listing = shelf.listing || 'private'

    const newShelf = {}
    Object.keys(shelf).forEach(key => {
      const attribute = shelf[key]
      if (!attributes.updatable.includes(key)) {
        throw error_.new(`invalid attribute: ${attribute}`, 400, { shelf })
      }
      validations.pass(key, attribute)
      newShelf[key] = attribute
    })

    newShelf.created = Date.now()

    return newShelf
  },

  updateAttributes: (oldShelf, newAttributes, userId) => {
    assert_.object(oldShelf)
    assert_.object(newAttributes)

    if (oldShelf.owner !== userId) {
      throw error_.new('wrong owner', 403, oldShelf.owner)
    }

    for (const attr of Object.keys(newAttributes)) {
      if (!(attributes.updatable.includes(attr))) {
        throw error_.new(`invalid attribute: ${attr}`, 400, oldShelf)
      }
    }

    const newShelf = _.clone(oldShelf)
    for (const attr of Object.keys(newAttributes)) {
      const newVal = newAttributes[attr]
      validations.pass(attr, newVal)
      newShelf[attr] = newVal
    }

    if (_.isEqual(newShelf, oldShelf)) {
      throw error_.new('nothing to update', 400, newAttributes)
    }

    newShelf.updated = Date.now()
    return newShelf
  }
}
