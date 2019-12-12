const CONFIG = require('config')
const __ = CONFIG.universalPath
const assert_ = __.require('utils', 'assert_types')
const validations = require('./validations/bookshelf')

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
  }
}
