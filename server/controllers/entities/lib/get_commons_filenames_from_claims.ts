import { flatten, pick, values } from 'lodash-es'
import type { SerializedEntity, WikimediaCommonsFilename } from '#types/entity'
import { prefixifyWdProperty } from './prefix.js'

export const nonPrefixedImageProperties = [
  // image
  'P18',
  // logo image
  'P154',
  // collage image
  'P2716',
  // related image
  'P6802',
] as const

export const imageProperties = nonPrefixedImageProperties.map(prefixifyWdProperty)

export function getCommonsFilenamesFromClaims (claims: SerializedEntity['claims']) {
  const imageClaims = flatten(values(pick(claims, imageProperties)))
  return imageClaims as WikimediaCommonsFilename[]
}
