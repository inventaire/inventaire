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
