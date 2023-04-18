import { flatten, pick, values } from 'lodash-es'
import { simplifyClaim } from 'wikibase-sdk'
import { unprefixify } from './prefix.js'

const imageClaims = [
  // image
  'wdt:P18',
  // logo image
  'wdt:P154',
  // collage image
  'wdt:P2716',
  // related image
  'wdt:P6802',
]

const nonPrefixedImageClaims = imageClaims.map(unprefixify)

export default (claims, needsSimplification = false) => {
  if (needsSimplification) {
    const images = flatten(values(pick(claims, nonPrefixedImageClaims)))
    return images.map(simplifyClaim)
  } else {
    const images = flatten(values(pick(claims, imageClaims)))
    return images
  }
}
