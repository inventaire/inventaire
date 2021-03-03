const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { typesNames } = __.require('lib', 'wikidata/aliases')
const sanitize = __.require('lib', 'sanitize/sanitize')
const allowedValuesPerTypePerProperty = __.require('controllers', 'entities/lib/properties/allowed_values_per_type_per_property')

const sanitization = {
  property: {
    allowlist: Object.keys(allowedValuesPerTypePerProperty)
  },
  type: {
    allowlist: typesNames
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(getAllowedValues)
  .then(responses_.Wrap(res, 'values'))
  .catch(error_.Handler(req, res))
}

const getAllowedValues = ({ property, type }) => {
  const allowedValuesPerType = allowedValuesPerTypePerProperty[property]
  if (allowedValuesPerType[type]) return allowedValuesPerType[type]
  else throw error_.new('unsupported type for this property', 400, { property, type })
}
