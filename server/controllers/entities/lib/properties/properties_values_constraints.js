// Each property configuration object is made of the following attributes:

// primitiveType: {Stirng} which type a property value should return when passed to typeOf
// datatype: {String} the more specific property value type
// validate: {Function}
// format: {Function} (optional)
// uniqueValue: {Boolean} (default: false)
// concurrency: {Boolean} (default: false)
// adminUpdateOnly: {Boolean} (default: false)
// entityValueTypes: {String[]} (only for properties of datatype 'entity' )

// Those attributes aim to constrain the claims properties and values
// to keep those consistent.

// Bases and builders are an attempt to keep those configuration objects DRY:
// Bases represent the most common configuration objects, and can be extended
// into more specific configs
import {
  PositiveInteger as positiveIntegerPattern,
  StrictlyPositiveInteger as strictlyPositiveIntegerPattern,
} from '#lib/regex'
import { collectionEntity, entity, genreEntity, humanEntity, imageHash, languageEntity, movementEntity, positiveInteger, positiveIntegerString, serieEntity, uniqueSimpleDay, uniqueString, url, workEntity, workOrSerieEntity } from './properties_config_bases.js'
// Builders are functions to generate config objects tailored as closely
// as possible to the property exact needs
import { isbnProperty, externalId, typedExternalId, allowedPropertyValues, externalIdWithFormatter } from './properties_config_builders.js'

// Make sure to not mutate the base, while letting the last word to the extension
const extend = (base, extension) => Object.assign({}, base, extension)

const uuidPattern = /[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/

// Keep in sync with ./properties_per_type
export const propertiesValuesConstraints = {
  // image
  'invp:P2': imageHash,
  // instance of
  'wdt:P31': allowedPropertyValues('wdt:P31'),
  // author
  'wdt:P50': extend(humanEntity, { hasPlaceholders: true }),
  // scenarist
  'wdt:P58': humanEntity,
  // editor
  'wdt:P98': humanEntity,
  // illustrator
  'wdt:P110': humanEntity,
  // founded by
  'wdt:P112': humanEntity,
  // publisher
  'wdt:P123': entity,
  // owned by
  'wdt:P127': entity,
  // movement
  'wdt:P135': movementEntity,
  // genre
  'wdt:P136': genreEntity,
  // based on
  'wdt:P144': workOrSerieEntity,
  // serie
  'wdt:P179': serieEntity,
  // collection
  'wdt:P195': collectionEntity,
  // ISBN 13
  'wdt:P212': isbnProperty(13),
  // ISNI
  'wdt:P213': externalIdWithFormatter({
    regex: /^\d{4} \d{4} \d{4} \d{3}[0-9X]$/,
    format: id => {
      id = id.replace(/\s/g, '')
      return `${id.slice(0, 4)} ${id.slice(4, 8)} ${id.slice(8, 12)} ${id.slice(12)}`
    },
  }),
  // VIAF id
  'wdt:P214': externalId(/^[1-9]\d(\d{0,7}|\d{17,20})$/),
  // GND ID
  'wdt:P227': externalId(/^1[01]?\d{7}[0-9X]|[47]\d{6}-\d|[1-9]\d{0,7}-[0-9X]|3\d{7}[0-9X]$/),
  // OCLC control number
  'wdt:P243': externalId(/^0*[1-9]\d*$/),
  // Library of Congress authority ID
  'wdt:P244': externalId(/^(gf|n|nb|nr|no|ns|sh|sj)([4-9][0-9]|00|20[0-2][0-9])[0-9]{6}$/),
  // BNF id
  'wdt:P268': externalIdWithFormatter({
    regex: /^\d{8}[0-9bcdfghjkmnpqrstvwxz]$/,
    format: id => id.replace(/^cb/, ''),
  }),
  // SUDOC authorities ID
  'wdt:P269': externalId(/^\d{8}[\dX]$/),
  // language of work
  'wdt:P407': languageEntity,
  // distribution format
  'wdt:P437': allowedPropertyValues('wdt:P437'),
  // ORCID ID
  'wdt:P496': externalId(/^0000-000(1-[5-9]|2-[0-9]|3-[0-4])\d{3}-\d{3}[\dX]?$/),
  // date of birth
  'wdt:P569': uniqueSimpleDay,
  // date of death
  'wdt:P570': uniqueSimpleDay,
  // inception
  'wdt:P571': uniqueSimpleDay,
  // dissolution date
  'wdt:P576': uniqueSimpleDay,
  // publication date
  'wdt:P577': uniqueSimpleDay,
  // edition of
  'wdt:P629': workEntity,
  // Open Library id
  'wdt:P648': typedExternalId({
    edition: /^OL[1-9]\d{0,7}M$/,
    work: /^OL[1-9]\d{0,7}W$/,
    human: /^OL[1-9]\d{0,7}A$/,
  }),
  // translator
  'wdt:P655': humanEntity,
  // Google Books ID
  'wdt:P675': externalId(/^[\w-]{12}$/),
  // influenced by
  'wdt:P737': entity,
  // narrative set in
  'wdt:P840': entity,
  // official website
  'wdt:P856': url,
  // main subject
  'wdt:P921': entity,
  // inspired by
  'wdt:P941': workOrSerieEntity,
  // Biblioteca Nacional de España ID
  'wdt:P950': typedExternalId({
    edition: /^(bima|bimo|bipa)\d{10}$/,
    work: /^XX\d{4,7}$/,
    human: /^XX\d{4,7}$/,
  }),
  // ISBN 10
  'wdt:P957': isbnProperty(10),
  // SUDOC editions
  'wdt:P1025': externalId(/^\d{8}[\dX]$/),
  // SWB editions
  'wdt:P1044': externalId(/^\d{8}[0-9X]$/),
  // Dutch National for Author Names ID
  'wdt:P1006': externalId(/^\d{8}(\d|X)$/),
  // Librarything work ID
  'wdt:P1085': externalId(/^\d{1,8}$/),
  // number of pages
  'wdt:P1104': positiveInteger,
  // BN (Argentine) editions
  'wdt:P1143': externalId(/^\d{9}$/),
  // Library of Congress Control Number (bibliographic)
  'wdt:P1144': externalId(/^[a-z]{0,3}\d{6,10}$/),
  // LIBRIS editions
  'wdt:P1182': externalId(strictlyPositiveIntegerPattern),
  // ISFDB title ID
  'wdt:P1274': externalId(/^[1-9]\d{0,6}$/),
  // DNB editions
  'wdt:P1292': externalId(/^\d{8,9}[X\d]?$/),
  // languages of expression
  'wdt:P1412': languageEntity,
  // title
  'wdt:P1476': uniqueString,
  // series ordinal
  // For the moment, ordinals can be only positive integers, but stringified
  // to stay consistent with Wikidata and let the door open to custom ordinals
  // later (ex: roman numbers, letters, etc.)
  'wdt:P1545': positiveIntegerString,
  // subtitle
  'wdt:P1680': uniqueString,
  // HathiTrust ID
  'wdt:P1844': externalId(/^\d{9}$/),
  // Project Gutenberg author ID
  'wdt:P1938': externalId(/^[1-9]\d{0,4}$/),
  // Google Scholar author ID
  'wdt:P1960': externalId(/^[\w-]{12}$/),
  // Anime News Network person ID
  'wdt:P1982': externalId(/^[1-9]\d{0,5}$/),
  // Anime News Network company ID
  'wdt:P1983': externalId(/^[1-9]\d{0,4}$/),
  // Anime News Network manga ID
  'wdt:P1984': externalId(strictlyPositiveIntegerPattern),
  // Twitter account
  'wdt:P2002': externalId(/^\w{1,15}$/),
  // Instagram username
  'wdt:P2003': externalId(/^(?!.*\.\.)(?!.*\.$)[^\W][\w.]{0,29}$/),
  // Facebook profile id
  'wdt:P2013': externalId(/^(\d+|[.\w]+)$/),
  // YouTube channel ID
  'wdt:P2397': externalId(/^UC[\w-]{21}[AQgw]$/),
  // BookBrainz author ID"
  'wdt:P2607': externalId(uuidPattern),
  // number of volumes
  'wdt:P2635': positiveInteger,
  // author of foreword
  'wdt:P2679': humanEntity,
  // author of afterword
  'wdt:P2680': humanEntity,
  // GoodReads author ID
  'wdt:P2963': externalId(strictlyPositiveIntegerPattern),
  // GoodReads book ID
  'wdt:P2969': externalId(strictlyPositiveIntegerPattern),
  // ISBN publisher prefix
  'wdt:P3035': extend(externalId(/^97(8|9)-\d{1,5}-\d{2,7}$/), { uniqueValue: false }),
  // Czech National Bibliography book ID
  'wdt:P3184': externalId(/^cnb[0-9]{9}$/),
  // Babelio author ID
  'wdt:P3630': externalId(positiveIntegerPattern),
  // Babelio work ID
  'wdt:P3631': externalId(positiveIntegerPattern),
  // Mastodon address
  'wdt:P4033': externalId(/^\w+@[a-z0-9.-]+[a-z0-9]+$/),
  // Theses.fr person ID
  'wdt:P4285': externalId(positiveIntegerPattern),
  // MyAnimeList people ID
  'wdt:P4084': externalId(positiveIntegerPattern),
  // MyAnimeList manga ID
  'wdt:P4087': externalId(positiveIntegerPattern),
  // BNB person ID
  'wdt:P5361': externalId(/^[^ ?.=]{2,80}$/),
  // BD Gest' author ID
  'wdt:P5491': externalId(strictlyPositiveIntegerPattern),
  // OCLC work ID
  'wdt:P5331': externalId(strictlyPositiveIntegerPattern),
  // British Library system number
  'wdt:P5199': externalId(/^\d{9}$/),
  // NooSFere book ID
  'wdt:P5571': externalId(strictlyPositiveIntegerPattern),
  // colorist
  'wdt:P6338': humanEntity,
  // Librarything author ID
  'wdt:P7400': externalId(/^[^\s/]+$/),
  // BookBrainz work ID"
  'wdt:P7823': externalId(uuidPattern),
  // BookBrainz publisher ID
  'wdt:P8063': externalId(uuidPattern),
  // Goodreads work ID
  'wdt:P8383': externalId(strictlyPositiveIntegerPattern),
  // letterer
  'wdt:P9191': humanEntity,
  // inker
  'wdt:P10836': humanEntity,
  // penciller
  'wdt:P10837': humanEntity,
}

export default propertiesValuesConstraints
