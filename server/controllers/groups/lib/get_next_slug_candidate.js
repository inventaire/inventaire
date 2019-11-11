// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

module.exports = function(slug){
  const parts = slug.split('.')
  const lastPart = _.last(parts)
  if (_.isPositiveIntegerString(lastPart)) {
    const next = parseInt(lastPart) + 1
    return parts.slice(0, -1).join('.') + `.${next}`
  } else {
    return slug + '.1'
  }
}
