const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const validations = require('./validations/shelf')
const attributes = require('./attributes/shelf')
const error_ = __.require('lib', 'error/error')
const { solveConstraint } = require('./helpers')(attributes)

module.exports = {
  create: shelf => {
    assert_.object(shelf)
    assert_.string(shelf.owner)
    assert_.string(shelf.name)
    shelf.listing = solveConstraint(shelf, 'listing')

    const newShelf = {}
    Object.keys(shelf).filter(key => {
      const attribute = shelf[key]
      if (!(attributes.updatable.includes(key))) {
        throw error_.new(`invalid attribute: ${attribute}`, 400, { shelf })
      }
      validations.pass(key, attribute)
      newShelf[key] = attribute
    })

    return _.assign({ created: Date.now() }, newShelf)
  },

  updateAttributes: (userId, params) => oldShelf => {
    assert_.object(oldShelf)
    assert_.object(params)

    if (oldShelf.owner !== userId) {
      throw error_.new('wrong owner', 403, oldShelf.owner)
    }

    for (const attr of _.keys(params)) {
      if (!(attributes.updatable.includes(attr))) {
        throw error_.new(`invalid attribute: ${attr}`, 400, oldShelf)
      }
    }
    const newAttributes = _.pick(params, attributes.updatable)
    if (_.isEmpty(newAttributes)) {
      throw error_.new('nothing to update', 400, params)
    }

    const newShelf = _.clone(oldShelf)
    for (const attr of _.keys(newAttributes)) {
      const newVal = newAttributes[attr]
      validations.pass(attr, newVal)
      newShelf[attr] = newVal
    }

    const now = Date.now()
    newShelf.updated = now
    return newShelf
  }
}
