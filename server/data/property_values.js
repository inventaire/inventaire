// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const { typesNames } = require('lib/wikidata/aliases')
const sanitize = require('lib/sanitize/sanitize')
const allowedValuesPerTypePerProperty = require('controllers/entities/lib/properties/allowed_values_per_type_per_property')

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
