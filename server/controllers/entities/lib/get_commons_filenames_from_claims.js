const { flatten, pick, values } = require('lodash')
const { simplify } = require('wikidata-sdk')
const { unprefixify } = require('./prefix')

const imageClaims = [
  // image
  'wdt:P18',
  // logo image
  'wdt:P154',
  // collage image
  'wdt:P2716'
]

const nonPrefixedImageClaims = imageClaims.map(unprefixify)

module.exports = (claims, needsSimplification = false) => {
  if (needsSimplification) {
    const images = flatten(values(pick(claims, nonPrefixedImageClaims)))
    return images.map(simplify.claim)
  } else {
    const images = flatten(values(pick(claims, imageClaims)))
    return images
  }
}
