// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('lodash')
const authorProperties = [
  // author
  'wdt:P50',
  // scenarist
  'wdt:P58',
  // illustrator
  'wdt:P110',
  // colorist
  'wdt:P6338'
]

module.exports = work => _(work.claims)
.pick(authorProperties)
.values()
.flatten()
.uniq()
.value()
