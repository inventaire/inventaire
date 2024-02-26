import { flatten, pick, values } from 'lodash-es'
import { simplifyClaim } from 'wikibase-sdk'
import { unprefixify } from './prefix.js'

export const imageProperties = [
  // image
  'wdt:P18',
  // logo image
  'wdt:P154',
  // collage image
  'wdt:P2716',
  // related image
  'wdt:P6802',
]

export const nonPrefixedImageProperties = imageProperties.map(unprefixify)

export default (claims, needsSimplification = false) => {
  if (needsSimplification) {
    const images = flatten(values(pick(claims, nonPrefixedImageProperties)))
    return images.map(simplifyClaim)
  } else {
    const images = flatten(values(pick(claims, imageProperties)))
    return images
  }
}
