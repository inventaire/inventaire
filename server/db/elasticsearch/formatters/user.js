const __ = require('config').universalPath
const { pick, without } = require('lodash')
const publicAttributes = require('models/attributes/user').public
// Omit snapshot as it contains private and semi priavte data
const publicAttributesStrict = without(publicAttributes, 'snapshot')

module.exports = doc => {
  const publicUserDoc = pick(doc, publicAttributesStrict)
  publicUserDoc.type = 'user'
  if (publicUserDoc.position != null) {
    const [ lat, lon ] = publicUserDoc.position
    publicUserDoc.position = { lat, lon }
  }
  return publicUserDoc
}
