# List of properties an entity of a given type can have
# Keep in sync with client/app/modules/entities/lib/editor/properties_per_type

all = [
  'wdt:P31' # instance of
]

workAndSerie = all.concat [
  'wdt:P50' # author
  'wdt:P136' # genre
  'wdt:P144' # based on
  'wdt:P364' # original language of work
  'wdt:P179' # series
  'wdt:P577' # publication date
  'wdt:P648' # Open Library ID
  'wdt:P856' # official website
  'wdt:P921' # main subject
  'wdt:P941' # inspired by
  'wdt:P1545' # series ordinal
]

module.exports =
  work: workAndSerie

  edition: all.concat [
    'wdt:P123' # publisher
    'wdt:P212' # ISBN-13
    'wdt:P407' # language
    'wdt:P577' # publication date
    'wdt:P629' # edition or translation of
    'wdt:P655' # translator
    'wdt:P957' # ISBN-10
    'wdt:P1476' # title
    'wdt:P1104' # number of pages
    'wdt:P1680' # subtitle
    'wdt:P2635' # number of volumes
    'wdt:P2679' # author of foreword
    'wdt:P2680' # author of afterword
    'invp:P2' # cover image hash
  ]

  human: all.concat [
    'wdt:P135' # movement
    'wdt:P569' # date of birth
    'wdt:P570' # date of death
    'wdt:P648' # Open Library ID
    'wdt:P737' # influenced by
    'wdt:P856' # official website
    'wdt:P1412' # languages of expression
    'wdt:P2002' # Twitter account
    'wdt:P2003' # Instagram username
    'wdt:P2013' # Facebook account
    'wdt:P2397' # YouTube channel ID
    'wdt:P4033' # Mastodon address
  ]

  serie: workAndSerie
