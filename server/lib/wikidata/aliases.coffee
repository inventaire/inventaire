__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Q } = __.require 'sharedLibs', 'wikidata_aliases'

# TODO: replace this list by a SPARQL generated list
# that can be refreshed from time to time
_.extend Q,
  series: [
    'wd:Q277759' # book series
    'wd:Q14406742' # comic book series
    'wd:Q21198342' # manga series
    'wd:Q1667921' # novel series
    'wd:Q3297186' # limited series
    'wd:Q21191134' # comic strip series
    'wd:Q17489659' # group of works
  ]
  works: [
    'wd:Q571' # book
    'wd:Q2831984' # comic book album
    'wd:Q1004' # bande dessinée / comic book
    'wd:Q1760610' # comic book
    'wd:Q838795' # comic strip
    'wd:Q8261' # novel / roman
    'wd:Q25379' # theatre play
    'wd:Q7725634' # literary work
    'wd:Q17518870' # group of literary works
    'wd:Q12308638' # poetry anthology
    'wd:Q386724' # work
    'wd:Q49084' # short story / conte
    'wd:Q34620' # Greek tragedy
    'wd:Q8274' # manga
    'wd:Q128093' # ebook
    'wd:Q17518461' # posthumous work
    'wd:Q179461' # religious text
  ]
  editions: [
    'wd:Q3331189' # edition
    'wd:Q3972943' # publishing
  ]
  articles: [
    'wd:Q191067' # article
    'wd:Q13442814' # scientific article
  ]
  genres: [
    'wd:Q483394' # genre
    'wd:Q223393' # literary genre
  ]

  # Types required to update the entity search engine
  # see server/controllers/entities/lib/update_wikidata_subset_search_engine
  publishers: [
    # publisher
    'wd:Q2085381'
    # book publishing company
    'wd:Q1320047'
    # comics publishing company
    'wd:Q1114515'
    # bandes dessinées publishing company
    'wd:Q3279251'
  ]
  movements: [
    # cultural movement
    'wd:Q2198855'
    # literary movement
    'wd:Q3326717'
    # art movement
    'wd:Q968159'
    # literary group
    'wd:Q23834194'
  ]

  # Types to ignore (Category pages, homonymie, etc.)
  meta: [
    'wd:Q4167836' # Wikimedia category
    'wd:Q4167410' # Wikimedia disambiguation page
  ]

types = {}

for type, typeIds of Q
  # drop the plural form
  type = type.replace /s$/, ''
  for id in typeIds
    types[id] = type

typesNames = Object.keys Q

getTypePluralNameByTypeUri = (uri)-> if types[uri] then "#{types[uri]}s"

# Key: property to redirect to
# Values: properties to redirect from
propertiesRedirections =
  # author
  'wdt:P50': [
    'wdt:P58' # screen writer / scénariste
  ]

aliases = {}

for mainProp, aliasedProps of propertiesRedirections
  for aliasedProp in aliasedProps
    aliases[aliasedProp] = mainProp

module.exports =
  aliases: aliases
  types: types
  typesNames: typesNames
  getTypePluralNameByTypeUri: getTypePluralNameByTypeUri
