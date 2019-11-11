// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const users = _.values(require('./hard_coded_documents').users)
const usersDb = __.require('couch', 'base')('users')

module.exports = function() {
  // Updating sequentially so that blue-cot initialize only a cookie session only once.
  // This seems to be required to avoid getting a 401 from CouchDB,
  // especially when CouchDB just started
  // Known case: when starting CouchDB and the server together with docker-compose
  var sequentialUpdate = function() {
    const nextUser = users.shift()
    if (nextUser == null) return 

    return updateDoc(usersDb, nextUser)
    .then(sequentialUpdate)
  }

  return sequentialUpdate()
}

var updateDoc = function(db, doc){
  const { _id: id } = doc
  return db.get(id)
  .then((currentDoc) => {
    // Copy the _rev so that the doc have a chance to match
    // and, if not, so that we can use db.put
    const docPath = `${db.name}/${id}`
    doc._rev = currentDoc._rev
    if (_.isEqual(currentDoc, doc)) {
      _.info(`${docPath} is up-to-date`)
      return
    } else {
      return db.put(doc)
      .then(_.Success(`${docPath} updated`))
    }}).catch((err) => {
    // If the doc is missing, create it
    if (err.statusCode === 404) { return db.put(doc)
    } else { throw err }
  })
}
