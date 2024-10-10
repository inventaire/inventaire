import { propertiesValuesConstraints } from '#controllers/entities/lib/properties/properties_values_constraints'
import type { ExtendedEntityType, PropertyUri } from '#server/types/entity'
import type { PropertyDatatype } from '#server/types/property'

export const allLocallyEditedEntitiesTypes = [ 'edition', 'work', 'serie', 'human', 'publisher', 'collection' ] as const

export const workAuthorRelationsProperties = [
  'wdt:P50', // author
  'wdt:P58', // scenarist
  'wdt:P98', // editor
  'wdt:P110', // illustrator
  'wdt:P6338', // colorist
  'wdt:P9191', // letterer
  'wdt:P10836', // inker
  'wdt:P10837', // penciller
] as const satisfies PropertyUri[]

export const editionAuthorRelationsProperties = [
  'wdt:P655', // translator
  'wdt:P2679', // author of foreword
  'wdt:P2680', // author of afterword
] as const satisfies PropertyUri[]

export const authorRelationsProperties = [
  ...workAuthorRelationsProperties,
  ...editionAuthorRelationsProperties,
] as const

export interface PropertyConfig {
  subjectTypes: readonly ExtendedEntityType[]
  datatype: PropertyDatatype
  multivalue: boolean
  entityValueTypes?: ExtendedEntityType[]
}

// Default `category` = 'general'
// Default `subjectTypes` = allLocallyEditedEntitiesTypes
export const _properties: Record<PropertyUri, Partial<PropertyConfig>> = {
  // image hash
  'invp:P2': {
    subjectTypes: [ 'edition' ],
  },
  // instance of
  'wdt:P31': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // founded by
  'wdt:P112': {
    subjectTypes: [ 'publisher' ],
  },
  // publisher
  'wdt:P123': {
    subjectTypes: [ 'edition', 'collection' ],
  },
  // owned by
  'wdt:P127': {
    subjectTypes: [ 'publisher' ],
  },
  // movement
  'wdt:P135': {
    subjectTypes: [ 'human' ],
  },
  // genre
  'wdt:P136': {
    subjectTypes: [ 'work', 'serie' ],
  },
  // based on
  'wdt:P144': {
    subjectTypes: [ 'work', 'serie' ],
  },
  // series
  'wdt:P179': {
    subjectTypes: [ 'work', 'serie' ],
  },
  // collection
  'wdt:P195': {
    subjectTypes: [ 'edition' ],
  },
  // ISBN-13
  'wdt:P212': {
    subjectTypes: [ 'edition' ],
  },
  // ISNI
  'wdt:P213': {
    subjectTypes: [ 'human' ],
  },
  // VIAF ID
  'wdt:P214': {
    subjectTypes: [ 'work', 'serie', 'edition', 'human' ],
  },
  // GND ID
  'wdt:P227': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // OCLC control number
  'wdt:P243': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // Library of Congress authority ID
  'wdt:P244': {
    subjectTypes: [ 'work', 'serie', 'human', 'publisher', 'collection' ],
  },
  // BNF ID
  'wdt:P268': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // SUDOC authorities ID
  'wdt:P269': {
    subjectTypes: [ 'work', 'serie', 'human' ],
  },
  // NDL of Japan Auth ID
  'wdt:P349': {
    subjectTypes: [ 'human' ],
  },
  // DOI
  'wdt:P356': {
    subjectTypes: [ 'edition' ],
  },
  // language
  'wdt:P407': {
    subjectTypes: [ 'work', 'serie', 'edition', 'collection' ],
  },
  // distribution format
  'wdt:P437': {
    subjectTypes: [ 'edition' ],
  },
  // ORCID ID
  'wdt:P496': {
    subjectTypes: [ 'human' ],
  },
  // date of birth
  'wdt:P569': {
    subjectTypes: [ 'human' ],
  },
  // date of death
  'wdt:P570': {
    subjectTypes: [ 'human' ],
  },
  // inception
  'wdt:P571': {
    subjectTypes: [ 'publisher' ],
  },
  // dissolution
  'wdt:P576': {
    subjectTypes: [ 'publisher' ],
  },
  // publication date
  'wdt:P577': {
    subjectTypes: [ 'work', 'serie', 'edition' ],
  },
  // edition or translation of
  'wdt:P629': {
    subjectTypes: [ 'edition' ],
  },
  // Open Library ID
  'wdt:P648': {
    subjectTypes: [ 'work', 'serie', 'human', 'edition' ],
  },
  // Google Books ID
  'wdt:P675': {
    subjectTypes: [ 'edition' ],
  },
  // influenced by
  'wdt:P737': {
    subjectTypes: [ 'human' ],
  },
  // official website
  'wdt:P856': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // SELIBR ID (Swedish)
  'wdt:P906': {
    subjectTypes: [ 'human' ],
  },
  // main subject
  'wdt:P921': {
    subjectTypes: [ 'work', 'serie', 'collection' ],
  },
  // inspired by
  'wdt:P941': {
    subjectTypes: [ 'work', 'serie' ],
  },
  // BNE ID
  'wdt:P950': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // ISBN-10
  'wdt:P957': {
    subjectTypes: [ 'edition' ],
  },
  // Dutch National for Author Names ID
  'wdt:P1006': {
    subjectTypes: [ 'human' ],
  },
  // SUDOC editions
  'wdt:P1025': {
    subjectTypes: [ 'edition' ],
  },
  // SWB editions
  'wdt:P1044': {
    subjectTypes: [ 'edition' ],
  },
  // Librarything work ID
  'wdt:P1085': {
    subjectTypes: [ 'work' ],
  },
  // number of pages
  'wdt:P1104': {
    subjectTypes: [ 'edition' ],
  },
  // BN (Argentine) editions
  'wdt:P1143': {
    subjectTypes: [ 'edition' ],
  },
  // Library of Congress Control Number
  'wdt:P1144': {
    subjectTypes: [ 'edition' ],
  },
  // LIBRIS editions
  'wdt:P1182': {
    subjectTypes: [ 'edition' ],
  },
  // ISFDB author ID
  'wdt:P1233': {
    subjectTypes: [ 'human' ],
  },
  // ISFDB publication ID
  'wdt:P1234': {
    subjectTypes: [ 'edition' ],
  },
  // ISFDB series ID
  'wdt:P1235': {
    subjectTypes: [ 'serie' ],
  },
  // ISFDB publisher ID
  'wdt:P1239': {
    subjectTypes: [ 'publisher' ],
  },
  // ISFDB title ID
  'wdt:P1274': {
    subjectTypes: [ 'work' ],
  },
  // DNB editions
  'wdt:P1292': {
    subjectTypes: [ 'edition' ],
  },
  // languages of expression
  'wdt:P1412': {
    subjectTypes: [ 'human' ],
  },
  // published in
  'wdt:P1433': {
    subjectTypes: [ 'article' ],
  },
  // title
  'wdt:P1476': {
    subjectTypes: [ 'edition', 'collection' ],
  },
  // series ordinal
  'wdt:P1545': {
    subjectTypes: [ 'work', 'serie' ],
  },
  // official blog URL
  'wdt:P1581': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // subtitle
  'wdt:P1680': {
    subjectTypes: [ 'edition', 'collection' ],
  },
  // HathiTrust ID
  'wdt:P1844': {
    subjectTypes: [ 'edition' ],
  },
  // Google Scholar author ID
  'wdt:P1960': {
    subjectTypes: [ 'human' ],
  },
  // Anime News Network person ID
  'wdt:P1982': {
    subjectTypes: [ 'human' ],
  },
  // Anime News Network company ID
  'wdt:P1983': {
    subjectTypes: [ 'publisher' ],
  },
  // Anime News Network manga ID
  'wdt:P1984': {
    subjectTypes: [ 'work', 'serie' ],
  },
  // Twitter account
  'wdt:P2002': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // Instagram username
  'wdt:P2003': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // Facebook account
  'wdt:P2013': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // YouTube channel ID
  'wdt:P2397': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // BookBrainz author ID
  'wdt:P2607': {
    subjectTypes: [ 'human' ],
  },
  // number of volumes
  'wdt:P2635': {
    subjectTypes: [ 'edition' ],
  },
  // reply to
  'wdt:P2675': {
    subjectTypes: [ 'work', 'serie' ],
  },
  // GoodReads author ID
  'wdt:P2963': {
    subjectTypes: [ 'human' ],
  },
  // GoodReads edition ID
  'wdt:P2969': {
    subjectTypes: [ 'edition' ],
  },
  // ISBN publisher prefix
  'wdt:P3035': {
    subjectTypes: [ 'publisher' ],
  },
  // Runeberg book ID
  'wdt:P3155': {
    subjectTypes: [ 'edition' ],
  },
  // Czech National Bibliography book ID
  'wdt:P3184': {
    subjectTypes: [ 'edition' ],
  },
  // Babelio author ID
  'wdt:P3630': {
    subjectTypes: [ 'human' ],
  },
  // Babelio work ID
  'wdt:P3631': {
    subjectTypes: [ 'work' ],
  },
  // Mastodon address
  'wdt:P4033': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // MyAnimeList people ID
  'wdt:P4084': {
    subjectTypes: [ 'human' ],
  },
  // MyAnimeList manga ID
  'wdt:P4087': {
    subjectTypes: [ 'work', 'serie' ],
  },
  // Theses.fr person ID
  'wdt:P4285': {
    subjectTypes: [ 'human' ],
  },
  // British Library system number
  'wdt:P5199': {
    subjectTypes: [ 'edition' ],
  },
  // OCLC work ID
  'wdt:P5331': {
    subjectTypes: [ 'work', 'serie' ],
  },
  // Cairn author ID
  'wdt:P4369': {
    subjectTypes: [ 'human' ],
  },
  // BNB person ID
  'wdt:P5361': {
    subjectTypes: [ 'human' ],
  },
  // BD Gest' author ID
  'wdt:P5491': {
    subjectTypes: [ 'human' ],
  },
  // NooSFere author ID
  'wdt:P5570': {
    subjectTypes: [ 'human' ],
  },
  // NooSFere book ID
  'wdt:P5571': {
    subjectTypes: [ 'work' ],
  },
  // NooSFere series ID
  'wdt:P5792': {
    subjectTypes: [ 'serie' ],
  },
  // NooSFere edition ID
  'wdt:P6901': {
    subjectTypes: [ 'edition' ],
  },
  // LinkedIn personal profile ID
  'wdt:P6634': {
    subjectTypes: [ 'human' ],
  },
  // Goodreads series ID
  'wdt:P6947': {
    subjectTypes: [ 'serie' ],
  },
  // LibraryThing author ID
  'wdt:P7400': {
    subjectTypes: [ 'human' ],
  },
  // BookBrainz work ID
  'wdt:P7823': {
    subjectTypes: [ 'work' ],
  },
  // form of creative work
  'wdt:P7937': {
    subjectTypes: [ 'work' ],
  },
  // BookBrainz publisher ID
  'wdt:P8063': {
    subjectTypes: [ 'publisher' ],
  },
  // Goodreads work ID
  'wdt:P8383': {
    subjectTypes: [ 'work' ],
  },
  // LibraryThing series ID
  'wdt:P8513': {
    subjectTypes: [ 'serie' ],
  },
  // BD Gest' series ID
  'wdt:P8619': {
    subjectTypes: [ 'serie' ],
  },
  // Threads username
  'wdt:P11892': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // BookBrainz series ID
  'wdt:P12048': {
    subjectTypes: [ 'serie' ],
  },
  // Babelio serial ID
  'wdt:P12319': {
    subjectTypes: [ 'serie' ],
  },
  // BookBrainz edition ID
  'wdt:P12351': {
    subjectTypes: [ 'edition' ],
  },
  // Bluesky username
  'wdt:P12361': {
    subjectTypes: allLocallyEditedEntitiesTypes,
  },
  // NooSFere publisher ID
  'wdt:P12852': {
    subjectTypes: [ 'publisher' ],
  },
  // NooSFere editorial collection ID
  'wdt:P13004': {
    subjectTypes: [ 'collection' ],
  },
}

for (const property of workAuthorRelationsProperties) {
  _properties[property] = {
    subjectTypes: [ 'work', 'serie' ],
  }
}

for (const property of editionAuthorRelationsProperties) {
  _properties[property] = {
    subjectTypes: [ 'edition' ],
  }
}

export const _propertiesPerType = {}

for (const type of allLocallyEditedEntitiesTypes) {
  _propertiesPerType[type] = []
}

for (const [ property, { subjectTypes } ] of Object.entries(_properties)) {
  for (const type of subjectTypes) {
    _propertiesPerType[type]?.push(property)
  }
  const propertyValuesConstraints = propertiesValuesConstraints[property]
  if (propertyValuesConstraints) {
    const { datatype, uniqueValue, entityValueTypes } = propertyValuesConstraints
    Object.assign(_properties[property], {
      datatype,
      multivalue: !uniqueValue,
      entityValueTypes,
    })
  } else {
    throw new Error(`missing property values constraints: ${property}`)
  }
}

export const propertiesPerType = _propertiesPerType as Record<typeof allLocallyEditedEntitiesTypes[number], PropertyUri[]>

export const properties = _properties as Record<PropertyUri, PropertyConfig>
