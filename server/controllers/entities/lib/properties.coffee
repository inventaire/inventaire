CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

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

# Keep in sync with app/modules/entities/lib/properties
# and app/modules/entities/lib/editor/properties_per_type
properties =
  # image
  'wdt:P18': bases.ipfsPath
  # instance of
  'wdt:P31': _.extend {}, bases.uniqueEntity, { adminUpdateOnly: true }
  # author
  'wdt:P50': bases.humanEntity
  # publisher
  'wdt:P123': bases.uniqueEntity
  # movement
  'wdt:P135': bases.entity
  # genre
  'wdt:P136': bases.entity
  # based on
  'wdt:P144': bases.workEntity
  # serie
  'wdt:P179': bases.serieEntity
  # ISBN 13
  'wdt:P212': builders.isbnProperty 13
  # VIAF id
  'wdt:P214': builders.externalId /^[1-9]\d(\d{0,7}|\d{17,20})$/
  # BNF id
  'wdt:P268': builders.externalId /^\d{8}[0-9bcdfghjkmnpqrstvwxz]$/
  # original language of work
  'wdt:P364': bases.entity
  # language of work
  'wdt:P407': bases.entity
  # date of birth
  'wdt:P569': bases.uniqueSimpleDay
  # date of death
  'wdt:P570': bases.uniqueSimpleDay
  # publication date
  'wdt:P577': bases.uniqueSimpleDay
  # edition of
  'wdt:P629': bases.workEntity
  # Open Library id
  'wdt:P648': builders.externalId /^OL[1-9]\d{0,7}[AMW]$/
  # translator
  'wdt:P655': bases.humanEntity
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
  # number of pages
  'wdt:P1104': bases.positiveInteger
  # languages of expression
  'wdt:P1412': bases.entity
  # title
  'wdt:P1476': bases.uniqueString
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
  # Mastodon address
  'wdt:P4033': builders.externalId /^\w+@[a-z0-9\.\-]+[a-z0-9]+$/

whitelist = Object.keys properties

expectedDatatype = (property)->
  properties[property].primordialDatatype or properties[property].datatype

module.exports =
  properties: properties
  expectedDatatype: expectedDatatype

  validateProperty: (property)->
    unless /^wdt:P\d+$/.test property
      throw error_.new 'invalid property', 400, property

    unless property in whitelist
      throw error_.new "property isn't whitelisted", 400, property

  validateDataType: (property, value)->
    _.typeOf(value) is expectedDatatype property
