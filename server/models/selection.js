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
  create: selection => {
    assert_.object(selection)
    assert_.string(selection.uri)
    assert_.string(selection.list)

    const newSelection = {}
    Object.keys(selection).forEach(attribute => {
      if (!attributes.validAtCreation.includes(attribute)) {
        throw error_.new('invalid attribute', 400, { attribute, selection })
      }
      validations.pass(attribute, selection[attribute])
      newSelection[attribute] = selection[attribute]
    })

    newSelection.created = Date.now()

    return newSelection
  },
}
