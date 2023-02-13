import { nonPrefixedImageClaims } from '#controllers/entities/lib/get_commons_filenames_from_claims'

const languagesCodesProperties = [
  'P218', // ISO 639-1 code
  'P219', // ISO 639-2 code
  'P220', // ISO 639-3 code
  'P221', // ISO 639-6 code
  'P424', // Wikimedia language code
  'P1798', // ISO 639-5 code
  'P9753', // Wikidata language code
]

export const languagesProperties = languagesCodesProperties.concat(nonPrefixedImageClaims)
