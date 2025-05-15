// PropertyValueConstraints attributes aim to constrain the claims properties and values
// to keep those consistent.

// Bases and builders are an attempt to keep those configuration objects DRY:
// Bases represent the most common configuration objects, and can be extended
// into more specific configs
import { getHost } from '#lib/network/helpers'
import {
  PositiveInteger as positiveIntegerPattern,
  StrictlyPositiveInteger as strictlyPositiveIntegerPattern,
  SignedInteger as signedIntegerPattern,
} from '#lib/regex'
import { objectKeys } from '#lib/utils/types'
import type { AbsoluteUrl, OmitNever } from '#types/common'
import type { PropertyUri } from '#types/entity'
import type { PropertyValueConstraints } from '#types/property'
import { collectionEntity, entity, entityType, genreEntity, humanEntity, humanOrPublisherEntity, imageHash, languageEntity, movementEntity, positiveInteger, positiveIntegerString, publisherEntity, remoteEntity, serieEntity, string, uniqueSimpleDay, uniqueString, url, workEntity, workOrSerieEntity } from './properties_config_bases.js'
// Builders are functions to generate config objects tailored as closely
// as possible to the property exact needs
import { isbnProperty, externalId, typedExternalId, allowedPropertyValues, externalIdWithFormatter, caseInsensitiveExternalId } from './properties_config_builders.js'

const uuidPattern = /[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/

export const allLocallyEditedEntitiesTypes = [ 'edition', 'work', 'serie', 'human', 'publisher', 'collection' ] as const

const localPropertiesValuesConstraints = {
  // same as remote entity
  'invp:P1': remoteEntity,
  // image hash
  'invp:P2': imageHash,
  // entity type lock
  'invp:P3': entityType,
} as const

export const localProperties = objectKeys(localPropertiesValuesConstraints)

export const propertiesValuesConstraints = {
  ...localPropertiesValuesConstraints,
  // instance of
  'wdt:P31': allowedPropertyValues('wdt:P31'),
  // author
  'wdt:P50': { ...humanEntity, hasPlaceholders: true } as const,
  // scenarist
  'wdt:P58': humanEntity,
  // editor
  'wdt:P98': humanEntity,
  // illustrator
  'wdt:P110': humanEntity,
  // founded by
  'wdt:P112': humanEntity,
  // publisher
  'wdt:P123': publisherEntity,
  // owned by
  'wdt:P127': humanOrPublisherEntity,
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
    regex: /^[0]{7}[0-9]{8}[0-9X]$/,
    format: id => id.replace(/\s/g, ''),
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
    format: id => id.replace(/^cb/, '').trim(),
  }),
  // SUDOC authorities ID
  'wdt:P269': externalId(/^\d{8}[\dX]$/),
  // NDL Authority ID
  'wdt:P349': externalId(/^(a1|s)?[0-9]?\d{8}$/),
  // DOI
  // See https://pardalotus.tech/posts/2024-10-02-falsehoods-programmers-believe-about-dois/#8-you-can-compare-doi-urls-for-equality
  'wdt:P356': caseInsensitiveExternalId(/^10.\d{4,9}\/[^\s]+$/),
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
  // pseudonym
  'wdt:P742': string,
  // influenced by
  'wdt:P737': humanEntity,
  // parent organization
  'wdt:P749': publisherEntity,
  // retrieved
  'wdt:P813': uniqueSimpleDay,
  // narrative set in
  'wdt:P840': entity,
  // reference URL
  'wdt:P854': url,
  // official website
  'wdt:P856': url,
  // SELIBR ID
  'wdt:P906': externalId(/^[1-9]\d{4,5}$/),
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
  // ISFDB author ID
  'wdt:P1233': externalId(/^[1-9]\d{0,5}$/),
  // ISFDB publication ID
  'wdt:P1234': externalId(/^[1-9]\d*$/),
  // ISFDB series ID
  'wdt:P1235': externalId(/^[1-9]\d{0,4}$/),
  // ISFDB publisher ID
  'wdt:P1239': externalId(/^[1-9]\d{0,4}$/),
  // ISFDB title ID
  'wdt:P1274': externalId(/^[1-9]\d{0,6}$/),
  // DNB editions
  'wdt:P1292': externalId(/^\d{8,9}[X\d]?$/),
  // languages of expression
  'wdt:P1412': languageEntity,
  // published in
  // TODO: restrict to journal entities
  'wdt:P1433': entity,
  // title
  'wdt:P1476': uniqueString,
  // series ordinal
  // For the moment, ordinals can be only positive integers, but stringified
  // to stay consistent with Wikidata and let the door open to custom ordinals
  // later (ex: roman numbers, letters, etc.)
  'wdt:P1545': positiveIntegerString,
  // official blog URL
  'wdt:P1581': url,
  // subtitle
  'wdt:P1680': uniqueString,
  // HathiTrust ID
  'wdt:P1844': externalId(/^\d{9}$/),
  // different from
  'wdt:P1889': entity,
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
  // BookBrainz author ID
  'wdt:P2607': externalId(uuidPattern),
  // number of volumes
  'wdt:P2635': positiveInteger,
  // reply to
  'wdt:P2675': workOrSerieEntity,
  // author of foreword
  'wdt:P2679': humanEntity,
  // author of afterword
  'wdt:P2680': humanEntity,
  // GoodReads author ID
  'wdt:P2963': externalId(strictlyPositiveIntegerPattern),
  // GoodReads book ID
  'wdt:P2969': externalId(strictlyPositiveIntegerPattern),
  // ISBN publisher prefix
  'wdt:P3035': { ...externalId(/^97(8|9)-\d{1,5}-\d{2,7}$/), uniqueValue: false } as const,
  // Runeberg book ID
  'wdt:P3155': externalId(/^[a-z0-9/.-]+$/),
  // Czech National Bibliography book ID
  'wdt:P3184': externalId(/^cnb[0-9]{9}$/),
  // Babelio author ID
  'wdt:P3630': externalId(positiveIntegerPattern),
  // Babelio work ID
  'wdt:P3631': externalId(positiveIntegerPattern),
  // Mastodon address
  'wdt:P4033': externalIdWithFormatter({
    regex: /^\w+@[a-z0-9.-]+[a-z0-9]+$/,
    format: (id: string) => {
      if (id.startsWith('http')) {
        const parts = id.split('@')
        if (parts.length === 3) {
          // Example https://mastodon.social/@foo@mamot.fr
          id = parts.slice(-2).join('@')
        } else if (parts.length === 2) {
          // Example https://mastodon.social/@foo
          const host = getHost(id as AbsoluteUrl)
          const handle = parts[1]
          id = `${handle}@${host}`
        }
      }
      return id.replace(/^@/, '').trim()
    },
  }),
  // MyAnimeList people ID
  'wdt:P4084': externalId(positiveIntegerPattern),
  // MyAnimeList manga ID
  'wdt:P4087': externalId(positiveIntegerPattern),
  // Theses.fr person ID
  'wdt:P4285': externalId(positiveIntegerPattern),
  // Cairn author ID
  'wdt:P4369': externalId(/[1-9]\d{0,5}/),
  // BNB person ID
  'wdt:P5361': externalId(/^[^ ?.=]{2,80}$/),
  // BD Gest' author ID
  'wdt:P5491': externalId(strictlyPositiveIntegerPattern),
  // OCLC work ID
  'wdt:P5331': externalId(strictlyPositiveIntegerPattern),
  // British Library system number
  'wdt:P5199': externalId(/^\d{9}$/),
  // NooSFere author ID
  'wdt:P5570': externalId(signedIntegerPattern),
  // NooSFere book ID
  'wdt:P5571': externalId(strictlyPositiveIntegerPattern),
  // NooSFere series ID
  'wdt:P5792': externalId(strictlyPositiveIntegerPattern),
  // NooSFere edition ID
  'wdt:P6901': externalId(signedIntegerPattern),
  // colorist
  'wdt:P6338': humanEntity,
  // LinkedIn personal profile ID
  'wdt:P6634': externalId(/^[\p{Letter}0-9\-&_'’.]+$/u),
  // Goodreads series ID
  'wdt:P6947': externalId(strictlyPositiveIntegerPattern),
  // Librarything author ID
  'wdt:P7400': externalId(/^[^\s/]+$/),
  // BookBrainz work ID
  'wdt:P7823': externalId(uuidPattern),
  // form of creative work
  'wdt:P7937': allowedPropertyValues('wdt:P7937'),
  // LibraryThing series ID
  'wdt:P8513': externalId(/^[1-9]\d{0,7}$/),
  // BookBrainz publisher ID
  'wdt:P8063': externalId(uuidPattern),
  // Goodreads work ID
  'wdt:P8383': externalId(strictlyPositiveIntegerPattern),
  // BD Gest' series ID
  'wdt:P8619': externalId(strictlyPositiveIntegerPattern),
  // letterer
  'wdt:P9191': humanEntity,
  // inker
  'wdt:P10836': humanEntity,
  // penciller
  'wdt:P10837': humanEntity,
  // Threads username
  'wdt:P11892': externalId(/^_{0,2}[a-z\d]+((\.|_{1,4}|\._)[a-z\d]+)*_{0,2}$/),
  // BookBrainz series ID
  'wdt:P12048': externalId(uuidPattern),
  // Babelio serial ID
  'wdt:P12319': externalId(strictlyPositiveIntegerPattern),
  // BookBrainz edition ID
  'wdt:P12351': externalId(uuidPattern),
  // Bluesky username
  'wdt:P12361': externalIdWithFormatter({
    regex: /^[\w-.]+$/,
    format: (id: string) => {
      if (/\/profile\//.test(id)) {
        id = id.split('/profile/')[1]
      }
      return id.replace(/^@/, '').trim()
    },
  }),
  // NooSFere publisher ID
  'wdt:P12852': externalId(signedIntegerPattern),
  // NooSFere editorial collection ID
  'wdt:P13004': externalId(signedIntegerPattern),
  // ISFDB editorial collection ID
  'wdt:P13137': externalId(strictlyPositiveIntegerPattern),
} as const satisfies Readonly<Record<PropertyUri, PropertyValueConstraints>>

export function getPropertyDatatype (property: PropertyUri) {
  return propertiesValuesConstraints[property]?.datatype
}

export function isExternaIdProperty (property: PropertyUri) {
  return getPropertyDatatype(property) === 'external-id'
}

export type PropertiesValuesConstraints = typeof propertiesValuesConstraints

type ExternalIdPropertiesValuesConstraints = OmitNever<{
  [P in keyof PropertiesValuesConstraints]: PropertiesValuesConstraints[P] & { datatype: 'external-id' }
}>

export type ExternalIdProperty = keyof ExternalIdPropertiesValuesConstraints

export const externalIdsProperties = objectKeys(propertiesValuesConstraints).filter(isExternaIdProperty) as ExternalIdProperty[]
