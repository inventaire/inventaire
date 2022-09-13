const assert_ = require('lib/utils/assert_types')
const { pass, entityUri, couchUuid } = require('./validations/common')
const validations = {
  pass,
  uri: entityUri,
  list: couchUuid,
}

const attributes = {
  validAtCreation: [
    'list',
    'uri',
  ]
}

const error_ = require('lib/error/error')

module.exports = {
  create: element => {
    assert_.object(element)
    assert_.string(element.uri)
    assert_.string(element.list)

    const newElement = {}
    Object.keys(element).forEach(attribute => {
      if (!attributes.validAtCreation.includes(attribute)) {
        throw error_.new('invalid attribute', 400, { attribute, element })
      }
      validations.pass(attribute, element[attribute])
      newElement[attribute] = element[attribute]
    })

    newElement.created = Date.now()

    return newElement
  },
}
