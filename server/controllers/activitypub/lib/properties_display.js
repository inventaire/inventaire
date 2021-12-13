// Ordered list of properties displayed as attachments
// Keep in sync with client/app/modules/entities/views/templates/{work,author,publisher,edition}_claims.hbs

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

module.exports = {
  human: authorProperties,
}
