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
