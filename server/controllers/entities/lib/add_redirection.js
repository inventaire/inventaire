const __ = require('config').universalPath
const assert_ = require('lib/utils/assert_types')

// Possibly overriding further redirects object
// Notice a tricky naming issue here:
// - 'redirects' is the name Wikidata uses to signal redirections as an object
// with a 'from' and a 'to', and that was thus adopted here too: those 'redirects'
// objects signal constated redirections.
// - 'redirect' is the attribute by which an entity document redirected to another
// entity keeps track of this redirection

// The entity is expected to be formatted, so that it's uri is defined

module.exports = (fromUri, formattedEntity) => {
  const { uri: toUri } = formattedEntity
  assert_.string(toUri)
  formattedEntity.redirects = { from: fromUri, to: toUri }
  return formattedEntity
}
