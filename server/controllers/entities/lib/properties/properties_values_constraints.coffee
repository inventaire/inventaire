CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

# Each property configuration object is made of the following attributes:

# datatype: {String}
# validate: {Function}
# format: {Function} (optional)
# uniqueValue: {Boolean} (default: false)
# concurrency: {Boolean} (default: false)
# adminUpdateOnly: {Boolean} (default: false)
# restrictedType: {String} (only for properties of datatype 'entity' )

# Those attributes aim to constrain the claims properties and values
# to keep those consistent.

# Bases and builders are an attempt to keep those configuration objects DRY:
# Bases represent the most common configuration objects, and can be extended
# into more specific configs
bases = require './properties_config_bases'
# Builders are functions to generate config objects tailored as closely
# as possible to the property exact needs
builders = require './properties_config_builders'

# Keep in sync with ./properties_per_type
module.exports =
  # image
  'invp:P2': bases.imageHash
  # country
  'wdt:P17': bases.entity
  # instance of
  'wdt:P31': _.extend {}, bases.uniqueEntity, { adminUpdateOnly: true }
  # author
  'wdt:P50': bases.humanEntity
  # founded by
  'wdt:P112': bases.humanEntity
  # publisher
  'wdt:P123': bases.uniqueEntity
  # owned by
  'wdt:P127': bases.entity
  # movement
  'wdt:P135': bases.entity
  # genre
  'wdt:P136': bases.entity
  # based on
  'wdt:P144': bases.workEntity
  # serie
  'wdt:P179': bases.serieEntity
  # ISNI
  'wdt:P213': builders.externalId /^\d{4} \d{4} \d{4} \d{3}[0-9X]$/
  # ISBN 13
  'wdt:P212': builders.isbnProperty 13
  # OCLC control number
  'wdt:P243': builders.externalId /^0*[1-9]\d*$/
  # SUDOC authorities ID
  'wdt:P269': builders.externalId /^\d{8}[\dX]$/
  # VIAF id
  'wdt:P214': builders.externalId /^[1-9]\d(\d{0,7}|\d{17,20})$/
  # GND ID
  'wdt:P227': builders.externalId /^1[01]?\d{7}[0-9X]|[47]\d{6}-\d|[1-9]\d{0,7}-[0-9X]|3\d{7}[0-9X]$/
  # BNF id
  'wdt:P268': builders.externalId /^\d{8}[0-9bcdfghjkmnpqrstvwxz]$/
  # original language of work
  'wdt:P364': bases.entity
  # language of work
  'wdt:P407': bases.entity
  # ORCID ID
  'wdt:P496': builders.externalId /^0000-000(1-[5-9]|2-[0-9]|3-[0-4])\d{3}-\d{3}[\dX]?$/
  # date of birth
  'wdt:P569': bases.uniqueSimpleDay
  # date of death
  'wdt:P570': bases.uniqueSimpleDay
  # inception
  'wdt:P571': bases.uniqueSimpleDay
  # dissolution date
  'wdt:P576': bases.uniqueSimpleDay
  # publication date
  'wdt:P577': bases.uniqueSimpleDay
  # edition of
  'wdt:P629': _.extend bases.workEntity, { critical: true }
  # Open Library id
  'wdt:P648': builders.externalId /^OL[1-9]\d{0,7}[AMW]$/
  # translator
  'wdt:P655': bases.humanEntity
  # Google Books ID
  'wdt:P675': builders.externalId /^[\w\-]{12}$/
  # influenced by
  'wdt:P737': bases.entity
  # narrative set in
  'wdt:P840': bases.entity
  # official website
  'wdt:P856': bases.url
  # main subject
  'wdt:P921': bases.entity
  # inspired by
  'wdt:P941': bases.workEntity
  # ISBN 10
  'wdt:P957': builders.isbnProperty 10
  # SUDOC editions
  'wdt:P1025': builders.externalId /^\d{8}[\dX]$/
  # SWB editions
  'wdt:P1044': builders.externalId /^\d{8}[0-9X]$/
  # Librarything work ID
  'wdt:P1085': builders.externalId /^\d{1,8}$/
  # number of pages
  'wdt:P1104': bases.positiveInteger
  # DNB editions
  'wdt:P1292': builders.externalId /^\d{8,9}[X\d]?$/
  # languages of expression
  'wdt:P1412': bases.entity
  # title
  'wdt:P1476': _.extend bases.uniqueString, { critical: true }
  # series ordinal
  'wdt:P1545': bases.ordinal
  # subtitle
  'wdt:P1680': bases.uniqueString
  # Twitter account
  'wdt:P2002': builders.externalId /^\w{1,15}$/
  # Instagram username
  'wdt:P2003': builders.externalId /^(\w(?:(?:\w|(?:\\.(?!\\.))){0,28}(?:\w))?)$/
  # Facebook profile id
  'wdt:P2013': builders.externalId /^(\d+|[\w\.]+)$/
  # YouTube channel ID
  'wdt:P2397': builders.externalId /^UC[\w\-]{21}[AQgw]$/
  # number of volumes
  'wdt:P2635': bases.positiveInteger
  # author of foreword
  'wdt:P2679': bases.humanEntity
  # author of afterword
  'wdt:P2680': bases.humanEntity
  # GoodReads author ID
  'wdt:P2963': builders.externalId /^[1-9]\d*$/
  # GoodReads book ID
  'wdt:P2969': builders.externalId /^[1-9]\d*$/
  # ISBN publisher
  'wdt:P3035': builders.externalId /^978-\d-\d{1,}$/
  # Babelio author ID
  'wdt:P3630': builders.externalId /^\d+$/
  # Babelio work ID
  'wdt:P3631': builders.externalId /^\d+$/
  # Mastodon address
  'wdt:P4033': builders.externalId /^\w+@[a-z0-9\.\-]+[a-z0-9]+$/
  # OCLC work ID
  'wdt:P5331': builders.externalId /^[1-9]\d*$/
