const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const validations = require('./validations/shelf')
const attributes = require('./attributes/shelf')
const error_ = __.require('lib', 'error/error')

const Shelf = module.exports = {
  create: params => {
    assert_.object(params)
    let newShelf = {}
    Object.keys(params).filter(key => {
      const attribute = params[key]
      if (!(attributes.includes(key))) return false
      validations.pass(key, attribute)
      newShelf[key] = attribute
    })

    return _.assign({ created: Date.now() }, newShelf)
  },

  updateAttributes: params => oldShelf => {
    assert_.object(oldShelf)

    if (oldShelf.owner !== params.reqUserId) {
      throw error_.new('wrong owner', 400, oldShelf.owner)
    }

    const newShelf = _.clone(oldShelf)
    const newAttributes = _.pick(params, attributes)

    if (_.isEmpty(newAttributes)) {
      throw error_.new('nothing to update', 400, params)
    }

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
