// Each property configuration object is made of the following attributes:

// datatype: {String}
// validate: {Function}
// format: {Function} (optional)
// uniqueValue: {Boolean} (default: false)
// concurrency: {Boolean} (default: false)
// adminUpdateOnly: {Boolean} (default: false)
// restrictedType: {String} (only for properties of datatype 'entity' )

// Those attributes aim to constrain the claims properties and values
// to keep those consistent.

// Bases and builders are an attempt to keep those configuration objects DRY:
// Bases represent the most common configuration objects, and can be extended
// into more specific configs
const bases = require('./properties_config_bases')
// Builders are functions to generate config objects tailored as closely
// as possible to the property exact needs
const builders = require('./properties_config_builders')

// Make sure to not mutate the base, while letting the last word to the extension
const extend = (base, extension) => Object.assign({}, base, extension)

const __ = require('config').universalPath

const {
  PositiveInteger: positiveIntegerPattern,
  StrictlyPositiveInteger: strictlyPositiveIntegerPattern
} = __.require('lib', 'regex')

// Keep in sync with ./properties_per_type
module.exports = {
  // image
  'invp:P2': bases.imageHash,
  // instance of
  'wdt:P31': extend(bases.uniqueEntity, { adminUpdateOnly: true }),
  // author
  'wdt:P50': extend(bases.humanEntity, { hasPlaceholders: true }),
  // founded by
  'wdt:P112': bases.humanEntity,
  // publisher
  'wdt:P123': bases.entity,
  // owned by
  'wdt:P127': bases.entity,
  // movement
  'wdt:P135': bases.entity,
  // genre
  'wdt:P136': bases.entity,
  // based on
  'wdt:P144': bases.workEntity,
  // serie
  'wdt:P179': bases.serieEntity,
  // collection
  'wdt:P195': bases.collectionEntity,
  // ISBN 13
  'wdt:P212': builders.isbnProperty(13),
  // ISNI
  'wdt:P213': builders.externalId(/^\d{4} \d{4} \d{4} \d{3}[0-9X]$/),
  // VIAF id
  'wdt:P214': builders.externalId(/^[1-9]\d(\d{0,7}|\d{17,20})$/),
  // GND ID
  'wdt:P227': builders.externalId(/^1[01]?\d{7}[0-9X]|[47]\d{6}-\d|[1-9]\d{0,7}-[0-9X]|3\d{7}[0-9X]$/),
  // OCLC control number
  'wdt:P243': builders.externalId(/^0*[1-9]\d*$/),
  // BNF id
  'wdt:P268': builders.externalId(/^\d{8}[0-9bcdfghjkmnpqrstvwxz]$/),
  // SUDOC authorities ID
  'wdt:P269': builders.externalId(/^\d{8}[\dX]$/),
  // language of work
  'wdt:P407': bases.entity,
  // ORCID ID
  'wdt:P496': builders.externalId(/^0000-000(1-[5-9]|2-[0-9]|3-[0-4])\d{3}-\d{3}[\dX]?$/),
  // date of birth
  'wdt:P569': bases.uniqueSimpleDay,
  // date of death
  'wdt:P570': bases.uniqueSimpleDay,
  // inception
  'wdt:P571': bases.uniqueSimpleDay,
  // dissolution date
  'wdt:P576': bases.uniqueSimpleDay,
  // publication date
  'wdt:P577': bases.uniqueSimpleDay,
  // edition of
  'wdt:P629': bases.workEntity,
  // Open Library id
  'wdt:P648': builders.typedExternalId({
    edition: /^OL[1-9]\d{0,7}M$/,
    work: /^OL[1-9]\d{0,7}W$/,
    human: /^OL[1-9]\d{0,7}A$/
  }),
  // translator
  'wdt:P655': bases.humanEntity,
  // Google Books ID
  'wdt:P675': builders.externalId(/^[\w-]{12}$/),
  // influenced by
  'wdt:P737': bases.entity,
  // narrative set in
  'wdt:P840': bases.entity,
  // official website
  'wdt:P856': bases.url,
  // main subject
  'wdt:P921': bases.entity,
  // inspired by
  'wdt:P941': bases.workEntity,
  // ISBN 10
  'wdt:P957': builders.isbnProperty(10),
  // SUDOC editions
  'wdt:P1025': builders.externalId(/^\d{8}[\dX]$/),
  // SWB editions
  'wdt:P1044': builders.externalId(/^\d{8}[0-9X]$/),
  // Dutch National for Author Names ID
  'wdt:P1006': builders.externalId(/^\d{8}(\d|X)$/),
  // Librarything work ID
  'wdt:P1085': builders.externalId(/^\d{1,8}$/),
  // number of pages
  'wdt:P1104': bases.positiveInteger,
  // BN (Argentine) editions
  'wdt:P1143': builders.externalId(/^\d{9}$/),
  // LIBRIS editions
  'wdt:P1182': builders.externalId(strictlyPositiveIntegerPattern),
  // ISFDB title ID
  'wdt:P1274': builders.externalId(/^[1-9]\d{0,6}$/),
  // DNB editions
  'wdt:P1292': builders.externalId(/^\d{8,9}[X\d]?$/),
  // languages of expression
  'wdt:P1412': bases.entity,
  // title
  'wdt:P1476': bases.uniqueString,
  // series ordinal
  'wdt:P1545': bases.ordinal,
  // subtitle
  'wdt:P1680': bases.uniqueString,
  // HathiTrust ID
  'wdt:P1844': builders.externalId(/^\d{9}$/),
  // Project Gutenberg author ID
  'wdt:P1938': builders.externalId(/^[1-9]\d{0,4}$/),
  // Google Scholar author ID
  'wdt:P1960': builders.externalId(/^[-\w]{12}$/),
  // Anime News Network person ID
  'wdt:P1982': builders.externalId(/^[1-9]\d{0,5}$/),
  // Anime News Network company ID
  'wdt:P1983': builders.externalId(/^[1-9]\d{0,4}$/),
  // Anime News Network manga ID
  'wdt:P1984': builders.externalId(strictlyPositiveIntegerPattern),
  // Twitter account
  'wdt:P2002': builders.externalId(/^\w{1,15}$/),
  // Instagram username
  'wdt:P2003': builders.externalId(/^(\w(?:(?:\w|(?:\\.(?!\\.))){0,28}(?:\w))?)$/),
  // Facebook profile id
  'wdt:P2013': builders.externalId(/^(\d+|[.\w]+)$/),
  // YouTube channel ID
  'wdt:P2397': builders.externalId(/^UC[\w-]{21}[AQgw]$/),
  // number of volumes
  'wdt:P2635': bases.positiveInteger,
  // author of foreword
  'wdt:P2679': bases.humanEntity,
  // author of afterword
  'wdt:P2680': bases.humanEntity,
  // GoodReads author ID
  'wdt:P2963': builders.externalId(strictlyPositiveIntegerPattern),
  // GoodReads book ID
  'wdt:P2969': builders.externalId(strictlyPositiveIntegerPattern),
  // ISBN publisher prefix
  'wdt:P3035': builders.externalId(/^97(8|9)-\d{1,5}-\d{2,7}$/),
  // Czech National Bibliography book ID
  'wdt:P3184': builders.externalId(/^cnb[0-9]{9}$/),
  // Babelio author ID
  'wdt:P3630': builders.externalId(positiveIntegerPattern),
  // Babelio work ID
  'wdt:P3631': builders.externalId(positiveIntegerPattern),
  // Mastodon address
  'wdt:P4033': builders.externalId(/^\w+@[a-z0-9.-]+[a-z0-9]+$/),
  // Theses.fr person ID
  'wdt:P4285': builders.externalId(positiveIntegerPattern),
  // MyAnimeList people ID
  'wdt:P4084': builders.externalId(positiveIntegerPattern),
  // MyAnimeList manga ID
  'wdt:P4087': builders.externalId(positiveIntegerPattern),
  // BNB person ID
  'wdt:P5361': builders.externalId(/^[^ ?.=]{2,80}$/),
  // BD Gest' author ID
  'wdt:P5491': builders.externalId(strictlyPositiveIntegerPattern),
  // OCLC work ID
  'wdt:P5331': builders.externalId(strictlyPositiveIntegerPattern),
  // NooSFere book ID
  'wdt:P5571': builders.externalId(strictlyPositiveIntegerPattern),
  // Librarything author ID
  'wdt:P7400': builders.externalId(/^[^\s/]+$/)
}
