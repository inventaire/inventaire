const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const validations = require('./validations/list')
const attributes = require('./attributes/list')
const error_ = require('lib/error/error')

module.exports = {
  create: list => {
    assert_.object(list)
    assert_.string(list.creator)
    assert_.string(list.name)

    const newList = {}
    Object.keys(list).forEach(key => {
      const value = list[key] || defaultValues[key]
      if (!attributes.validAtCreation.includes(key)) {
        throw error_.new(`invalid attribute: ${value}`, 400, { list, key, value })
      }
      validations.pass(key, value)
      newList[key] = value
    })

    newList.created = Date.now()

    return newList
  },

  updateAttributes: (oldList, newAttributes, creatorId) => {
    assert_.object(oldList)
    assert_.object(newAttributes)
    if (oldList.creator !== creatorId) {
      throw error_.new('wrong user', 403, oldList.creator)
    }
    for (const attr of Object.keys(newAttributes)) {
      if (!(attributes.updatable.includes(attr))) {
        throw error_.new(`invalid attribute: ${attr}`, 400, oldList)
      }
    }
    const updatedList = _.clone(oldList)
    for (const attr of Object.keys(newAttributes)) {
      const newVal = newAttributes[attr] || defaultValues[attr]
      validations.pass(attr, newVal)
      updatedList[attr] = newVal
    }

    if (_.isEqual(updatedList, oldList)) {
      throw error_.new('nothing to update', 400, newAttributes)
    }
    updatedList.updated = Date.now()
    return updatedList
  }
}

const defaultValues = {
  description: '',
  listing: 'private'
}
