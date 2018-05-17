# Keep in sync with app/modules/entities/lib/properties.coffee
# and server/controllers/entities/lib/properties.coffee
# and server/lib/wikidata/whitelisted_properties.coffee
# and [client i18n branch] src/wikidata/properties_list.coffee

work =
  'wdt:P50': {} # author
  'wdt:P577': {} # publication date
  'wdt:P136': {} # genre
  'wdt:P179': {} # series
  'wdt:P1545': {} # series ordinal
  'wdt:P921': {} # main subject
  'wdt:P144': {} # based on
  'wdt:P941': {} # inspired by
  'wdt:P364': {} # original language of work
  'wdt:P856': {} # official website
  # 'wdt:P31: {}' # instance of (=> works aliases)
  # 'wdt:P110': {} # illustrator
  # 'wdt:P1476': {} # title (using P364 lang)
  # 'wdt:P1680': {} # subtitle (using P364 lang)
  # 'wdt:P840': {} # narrative location
  # 'wdt:P674': {} # characters

  # Reverse properties
  'wdt:P747': { customLabel: 'editions' } # editions (inverse of wdt:P629)

module.exports = (_)->
  work: work
  edition:
    'wdt:P1476': { customLabel: 'edition title' }
    'wdt:P1680': { customLabel: 'edition subtitle' }
    'wdt:P629': {} # edition or translation of
    'wdt:P407': { customLabel: 'edition language' }
    'wdt:P18': { customLabel: 'cover' }
    # 'wdt:P31': {} # P31: instance of (=> edition aliases?)
    # P212 is used as unique ISBN field, accepting ISBN-10 but correcting server-side
    'wdt:P212': {} # ISBN-13
    'wdt:P957': {} # ISBN-10
    'wdt:P577': {} # publication date
    'wdt:P123': {} # publisher
    'wdt:P655': {} # translator
    'wdt:P2679': {} # author of foreword
    'wdt:P2680': {} # author of afterword
    'wdt:P1104': {} # number of pages
    'wdt:P2635': {} # number of volumes

  human:
    'wdt:P1412': {} # languages of expression
    'wdt:P135': {} # movement
    'wdt:P569': {} # date of birth
    'wdt:P570': {} # date of death
    'wdt:P737': {} # influenced by
    'wdt:P856': {} # official website
    'wdt:P2002': {} # Twitter account
    'wdt:P2013': {} # Facebook account
    'wdt:P2003': {} # Instagram username
    'wdt:P2397': {} # YouTube channel ID
    'wdt:P4033': {} # Mastodon address

  # Using omit instead of having a common list, extended for works, so that
  # the properties order isn't constrained by being part or not of the common properties
  serie: _.omit work, [ 'wdt:P179', 'wdt:P1545', 'wdt:P747' ]
