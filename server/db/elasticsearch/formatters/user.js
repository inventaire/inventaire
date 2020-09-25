const __ = require('config').universalPath
const { pick, without } = require('lodash')
const publicAttributes = __.require('models', 'attributes/user').public
// Omit snapshot as it contains private and semi priavte data
const publicAttributesStrict = without(publicAttributes, 'snapshot')

module.exports = doc => {
  // Do not filter-out doc.type=deletedUser so that deleted users can be updated
  // and filtered-out at search time
  // It would be better to just unindex deleted users, but that's not something we can do with couch2elastic4sync
  if (doc.type === 'user' || doc.type === 'deletedUser') {
    const data = pick(doc, publicAttributesStrict)
    if (doc.type === 'deletedUser') data.deleted = true
    return data
  }
}
