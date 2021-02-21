const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { typesNames } = __.require('lib', 'wikidata/aliases')
const sanitize = __.require('lib', 'sanitize/sanitize')
const propertiesValuesPerTypesLists = __.require('controllers', 'entities/lib/properties/properties_values_per_types_lists')

const sanitization = {
  property: {
    allowlist: Object.keys(propertiesValuesPerTypesLists)
  },
  type: {
    allowlist: typesNames
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(getPropertyValues)
  .then(responses_.Wrap(res, 'values'))
  .catch(error_.Handler(req, res))
}

const getPropertyValues = ({ property, type }) => {
  const list = propertiesValuesPerTypesLists[property]
  if (list[type]) return list[type]
  else throw error_.new('unsupported type for this property', 400, { property, type })
}
