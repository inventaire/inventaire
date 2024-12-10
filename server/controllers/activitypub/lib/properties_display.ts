// Ordered list of properties displayed as attachments
// Keep in sync with client/app/modules/entities/views/templates/{work,author,publisher,edition}_claims.hbs

const workProperties = {
  'wdt:P361': 'entity', // part of
  'wdt:P179': 'entity', // serie
  'wdt:P1545': 'string', // serie ordinal
  'wdt:P407': 'entityString', // original language
  'wdt:P577': 'time', // publication date
  'wdt:P144': 'entity', // based on
  'wdt:P2675': 'entity', // reply to
  'wdt:P941': 'entity', // inspired by
  'wdt:P136': 'entity', // genre
  'wdt:P135': 'entity', // movement
  'wdt:P921': 'entity', // main subject
  'wdt:P840': 'entity', // narrative set in
  'wdt:P674': 'entity', // characters
  'wdt:P1433': 'entity', // published in
  'wdt:P155': 'entity', // preceded by
  'wdt:P156': 'entity', // followed by
  'wdt:P856': 'url', // official website
  'wdt:P953': 'url', // full text available at
}

const authorProperties = {
  'wdt:P135': 'entity', // movement
  'wdt:P136': 'entity', // genre
  'wdt:P27': 'entityString', // country of citizenship
  'wdt:P103': 'entityString', // native language
  'wdt:P1412': 'entityString', // language of expression
  'wdt:P69': 'entity', // educated at
  'wdt:P106': 'entity', // occupation
  'wdt:P166': 'entity', // award received
  'wdt:P39': 'entityString', // position held
  'wdt:P1066': 'entity', // student of
  'wdt:P737': 'entity', // influence by
  'wdt:P856': 'url', // official website
  'wdt:P4033': 'platform', // mastodon
}

const editionProperties = {
  'wdt:P1680': 'string', // subtitle
  'wdt:P629': 'entity', // edition of
  'wdt:P50': 'entity', // author
  'wdt:P58': 'entity', // scenarist
  'wdt:P110': 'entity', // illustrator
  'wdt:P6338': 'entity', // colorist
  'wdt:P179': 'entity', // serie
  'wdt:P2679': 'entity', // author of foreword
  'wdt:P2680': 'entity', // author of afterword
  'wdt:P655': 'entity', // translator
  'wdt:P407': 'entityString', // edition language
  'wdt:P123': 'entity', // publisher
  'wdt:P195': 'entity', // collection
  'wdt:P577': 'time', // publication date
  'wdt:P1104': 'quantity', // number of pages
  'wdt:P2635': 'quantity', // number of volumes
  'wdt:P856': 'url', // official website
  // TODO: add 'wdt:P212' and 'wdt:P957'
}

const publisherProperties = {
  'wdt:P571': 'time', // inception
  'wdt:P576': 'time', // dissolution
  'wdt:P112': 'entity', // founded by
  'wdt:P127': 'entity', // owned by
  'wdt:P749': 'entity', // parent organization
  'wdt:P856': 'url', // official website
  'wdt:P4033': 'platform', // mastodon
}

const collectionProperties = {
  'wdt:P1680': 'string', // subtitle
  'wdt:P123': 'entity', // publisher
  'wdt:P98': 'entity', // editor
  'wdt:P856': 'url', // official website
}

export const propertiesDisplay = {
  human: authorProperties,
  work: workProperties,
  publisher: publisherProperties,
  edition: editionProperties,
  collection: collectionProperties,
  serie: workProperties,
}
