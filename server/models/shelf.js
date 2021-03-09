const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const validations = require('./validations/shelf')
const attributes = require('./attributes/shelf')
const error_ = require('lib/error/error')

module.exports = {
  create: shelf => {
    assert_.object(shelf)
    assert_.string(shelf.owner)
    assert_.string(shelf.name)

    const newShelf = {}
    Object.keys(shelf).forEach(key => {
      const value = shelf[key] || defaultValues[key]
      if (!attributes.updatable.includes(key)) {
        throw error_.new(`invalid attribute: ${value}`, 400, { shelf })
      }
      validations.pass(key, value)
      newShelf[key] = value
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

    const updatedShelf = _.clone(oldShelf)
    for (const attr of Object.keys(newAttributes)) {
      const newVal = newAttributes[attr] || defaultValues[attr]
      validations.pass(attr, newVal)
      updatedShelf[attr] = newVal
    }

    if (_.isEqual(updatedShelf, oldShelf)) {
      throw error_.new('nothing to update', 400, newAttributes)
    }

    updatedShelf.updated = Date.now()
    return updatedShelf
  }
}

const defaultValues = {
  description: '',
  listing: 'private'
}
