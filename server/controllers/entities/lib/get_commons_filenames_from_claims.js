// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const _ = require('lodash')

const imageClaims = [
  // image
  'wdt:P18',
  // logo image
  'wdt:P154',
  // collage image
  'wdt:P2716'
]

module.exports = claims => _.flatten(_.values(_.pick(claims, imageClaims)))
