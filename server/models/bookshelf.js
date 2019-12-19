const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const validations = require('./validations/bookshelf')
const attributes = require('./attributes/bookshelf')
const error_ = __.require('lib', 'error/error')

module.exports = {
  create: newBookshelf => {
    assert_.object(newBookshelf)
    const { name, listing, description, reqUserId } = newBookshelf

    validations.pass('name', name)
    validations.pass('description', description)
    validations.pass('listing', listing)
    validations.pass('userId', reqUserId)

    return {
      name,
      description,
      listing,
      owner: reqUserId,
      created: Date.now()
    }
  },

  updateAttributes: params => oldBookshelf => {
    assert_.object(oldBookshelf)

    if (oldBookshelf.owner !== params.reqUserId) {
      throw error_.new('wrong owner', 400, oldBookshelf.owner)
    }

    const newBookshelf = _.clone(oldBookshelf)
    const newAttributes = _.pick(params, attributes)

    if (_.isEmpty(newAttributes)) {
      throw error_.new('nothing to update', 400, params)
    }

    for (const attr of _.keys(newAttributes)) {
      const newVal = newAttributes[attr]
      validations.pass(attr, newVal)
      newBookshelf[attr] = newVal
    }

    const now = Date.now()
    newBookshelf.updated = now
    return newBookshelf
  }
}
