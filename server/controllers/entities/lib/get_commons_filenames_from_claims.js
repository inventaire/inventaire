import { flatten, pick, values } from 'lodash'
import { simplify } from 'wikidata-sdk'
import { unprefixify } from './prefix'

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
    return images.map(simplify.claim)
  } else {
    const images = flatten(values(pick(claims, imageClaims)))
    return images
  }
}
