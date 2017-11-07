# The list of all the properties used server-side or client-side
# to keep when formatting Wikidata entities
# Motivations:
# - counter-balancing the extra work on picking properties by not having
#   to simplify claims that won't be used
# - saving space in server and client cache
# - saving everyone's bandwidth

module.exports = [
  'P18' # image
  'P27' # country of citizenship
  'P31' # instance of
  'P39' # position held
  'P50' # author
  'P58' # screen writer
  'P69' # educated at
  'P103' # native language
  'P106' # occupation
  'P109' # signature
  'P110' # illustrator
  'P123' # publisher
  'P135' # movement
  'P136' # genre
  'P144' # based on
  'P154' # logo image
  'P155' # follow
  'P156' # is follow by
  'P166' # award received
  'P179' # series
  'P195' # collection
  'P212' # isbn 13
  'P356' # DOI
  'P361' # part of
  'P364' # original language of work
  'P407' # language of work
  'P577' # publication date
  'P569' # date of birth
  'P570' # date of death
  'P629' # edition or translation of
  'P648' # Open Library ID
  'P655' # translator
  'P674' # characters
  'P737' # influence by
  'P738' # influence of
  'P840' # narrative location
  'P856' # official website
  'P921' # main subject
  'P941' # inspired by
  'P953' # full text available at
  'P957' # isbn 10
  'P1066' # student of
  'P1104' # number of pages
  'P1412' # languages spoken, written or signed
  'P1476' # title
  'P1545' # series ordinal
  'P1680' # subtitle
  'P1938' # Project Gutenberg author ID
  'P2002' # twitter
  'P2003' # instagram
  'P2013' # facebook
  'P2034' # Project Gutenberg ebook ID
  'P2093' # author name string
  'P2397' # YouTube channel ID
  'P2635' # number of volumes
  'P2679' # author of foreword
  'P2680' # author of afterword
  'P2716' # collage image
]
