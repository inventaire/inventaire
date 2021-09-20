// List of properties an entity of a given type can have
// Keep in sync with client/app/modules/entities/lib/editor/properties_per_type

const all = [
  'wdt:P31', // instance of
  'wdt:P227', // GND ID
  'wdt:P243', // OCLC control number
  'wdt:P268', // BNF ID
  'wdt:P856', // official website
  'wdt:P950', // BNE ID
]

const socialNetworks = [
  'wdt:P2002', // Twitter account
  'wdt:P2003', // Instagram username
  'wdt:P2013', // Facebook account
  'wdt:P2397', // YouTube channel ID
  'wdt:P4033', // Mastodon address
]

const workAndSerie = all.concat([
  'wdt:P50', // author
  'wdt:P136', // genre
  'wdt:P144', // based on
  'wdt:P179', // series
  'wdt:P214', // VIAF ID
  'wdt:P269', // SUDOC authorities ID
  'wdt:P407', // language
  'wdt:P577', // publication date
  'wdt:P648', // Open Library ID
  'wdt:P921', // main subject
  'wdt:P941', // inspired by
  'wdt:P1085', // Librarything work ID
  'wdt:P1143', // BN (Argentine) editions
  'wdt:P1545', // series ordinal
  'wdt:P1844', // HathiTrust ID
  'wdt:P1984', // Anime News Network manga ID
  'wdt:P3184', // Czech National Bibliography book ID
  'wdt:P3631', // Babelio work ID
  'wdt:P4087', // MyAnimeList manga ID
  'wdt:P5331', // OCLC work ID
  ...socialNetworks
])

module.exports = {
  edition: all.concat([
    'wdt:P123', // publisher
    'wdt:P195', // collection
    'wdt:P212', // ISBN-13
    'wdt:P214', // VIAF ID
    'wdt:P407', // language
    'wdt:P437', // distribution format
    'wdt:P577', // publication date
    'wdt:P629', // edition or translation of
    'wdt:P648', // Open Library ID
    'wdt:P655', // translator
    'wdt:P675', // identifiant Google Livres
    'wdt:P957', // ISBN-10
    'wdt:P1025', // SUDOC editions
    'wdt:P1044', // SWB editions
    'wdt:P1104', // number of pages
    'wdt:P1182', // LIBRIS editions
    'wdt:P1274', // ISFDB title ID
    'wdt:P1292', // DNB editions
    'wdt:P1476', // title
    'wdt:P1680', // subtitle
    'wdt:P2635', // number of volumes
    'wdt:P2679', // author of foreword
    'wdt:P2680', // author of afterword
    'wdt:P2969', // GoodReads book ID
    'wdt:P3184', // Czech National Bibliography book ID
    'wdt:P5199', // British Library system number
    'wdt:P5571', // NooSFere book ID
    'invp:P2', // cover image hash
  ]),

  work: workAndSerie,

  serie: workAndSerie,

  human: all.concat([
    'wdt:P31', // instance of
    'wdt:P135', // movement
    'wdt:P213', // ISNI
    'wdt:P214', // VIAF ID
    'wdt:P269', // SUDOC authorities ID
    'wdt:P349', // NDL of Japan Auth ID
    'wdt:P496', // ORCID ID
    'wdt:P569', // date of birth
    'wdt:P570', // date of death
    'wdt:P648', // Open Library ID
    'wdt:P737', // influenced by
    'wdt:P906', // SELIBR ID (Swedish)
    'wdt:P1006', // Dutch National for Author Names ID
    'wdt:P1412', // languages of expression
    'wdt:P1960', // Google Scholar author ID
    'wdt:P1982', // Anime News Network person ID
    'wdt:P2963', // GoodReads author ID
    'wdt:P3630', // Babelio author ID
    'wdt:P4084', // MyAnimeList people ID
    'wdt:P4285', // Theses.fr person ID
    'wdt:P5361', // BNB person ID
    'wdt:P5491', // BD Gest' author ID
    'wdt:P7400', // LibraryThing author ID
    ...socialNetworks
  ]),

  publisher: all.concat([
    'wdt:P112', // founded by
    'wdt:P127', // owned by
    'wdt:P571', // inception
    'wdt:P576', // dissolution
    'wdt:P1983', // Anime News Network company ID
    'wdt:P3035', // ISBN publisher prefix
    ...socialNetworks
  ]),

  collection: all.concat([
    'wdt:P123', // publisher
    'wdt:P1476', // title
    'wdt:P1680', // subtitle
    'wdt:P921', // main subject
    ...socialNetworks
  ])
}
