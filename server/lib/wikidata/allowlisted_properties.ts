// The list of all the properties used server-side or client-side
// to keep when formatting Wikidata entities
// Motivations:
// - counter-balancing the extra work on picking properties by not having
//   to simplify claims that won't be used
// - saving space in server and client cache
// - saving everyone's bandwidth

import { nonPrefixedImageProperties } from '#controllers/entities/lib/get_commons_filenames_from_claims'
import { nonPrefixedLanguagesCodesProperties } from '#controllers/entities/lib/languages'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { propertiesPerType } from '#controllers/entities/lib/properties/properties'
import { propertiesValuesConstraints } from '#controllers/entities/lib/properties/properties_values_constraints'
import { objectKeys } from '#lib/utils/types'
import type { WdPropertyId } from '#server/types/entity'

const editedProperties = objectKeys(propertiesValuesConstraints)
  .filter(property => property.startsWith('wdt:'))
  .map(unprefixify) as WdPropertyId[]

// Properties used to avoid false positives in duplicates detection
const relationsProperties = [
  'P22', // father
  'P25', // mother
  'P26', // spouse
  'P40', // child
  'P738', // influence of
  'P1038', // relative
  'P1066', // student of
  'P1889', // different from
  'P3342', // significant person
  'P3373', // sibling
  'P3448', // stepparent
  'P8810', // parent
] as const satisfies WdPropertyId[]

// Properties that can not be edited from Inventaire, but that might
// still be displayed or used in some way
const otherHumanProperties = [
  'P27', // country of citizenship
  'P39', // position held
  'P69', // educated at
  'P103', // native language
  'P106', // occupation
  'P109', // signature
]

const otherWorkProperties = [
  'P674', // characters
  'P840', // narrative location
  'P1476', // title
  'P1680', // subtitle
]

const commonOtherNonEditedProperties = [
  'P138', // named after
  'P155', // follow
  'P156', // is follow by
  'P166', // award received
  'P361', // part of
  'P724', // Internet Archive ID
  'P953', // full text available at
  'P1433', // published in
  'P2034', // Project Gutenberg ebook ID
  'P2093', // author name string
  'P2860', // cite
  'P2959', // permanent duplicated item
  'P4258', // Gallica ID
  ...nonPrefixedImageProperties,
] as const satisfies WdPropertyId[]

const extraWdProperties = [
  ...commonOtherNonEditedProperties,
  ...relationsProperties,
  ...nonPrefixedLanguagesCodesProperties,
] as const

export const allowlistedProperties = [ ...editedProperties, ...extraWdProperties ] as const

export const allowlistedPropertiesPerType = {
  human: [ ...propertiesPerType.human.map(unprefixify), ...relationsProperties, ...otherHumanProperties, ...commonOtherNonEditedProperties ],
  work: [ ...propertiesPerType.work.map(unprefixify), ...otherWorkProperties, ...commonOtherNonEditedProperties ],
  serie: [ ...propertiesPerType.serie.map(unprefixify), ...otherWorkProperties, ...commonOtherNonEditedProperties ],
  edition: [ ...propertiesPerType.edition.map(unprefixify), ...commonOtherNonEditedProperties ],
  publisher: [ ...propertiesPerType.publisher.map(unprefixify), ...commonOtherNonEditedProperties ],
  collection: [ ...propertiesPerType.collection.map(unprefixify), ...commonOtherNonEditedProperties ],
} as const

export type ExtraWdPropertyId = typeof extraWdProperties[number]
export type ExtraWdPropertyUri = `wdt:${ExtraWdPropertyId}`
