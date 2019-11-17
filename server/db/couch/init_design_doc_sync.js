// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Keep the design doc files in sync with CouchDB design docs
// once CouchDB design docs were updated to match the design doc files
// This allows to modify design docs in CouchDB GUI instead of having
// to change files manually, with all the formatting implied.
// This only make sense in development

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const fs_ = __.require('lib', 'fs')
const follow = __.require('lib', 'follow')
const dbsList = require('./list')
const designDocFolder = __.path('couchdb', 'design_docs')

module.exports = () => {
  if (!CONFIG.db.enableDesignDocSync) return
  // Wait for the end of the server initalization
  return setTimeout(init, 2000)
}

const init = () => (() => {
  const result = []
  for (const dbBaseName in dbsList) {
    const designDocsNames = dbsList[dbBaseName]
    result.push(follow({
      dbBaseName,
      filter: isDesignDoc(designDocsNames),
      onChange: _.debounce(syncDesignDocFile, 1000)
    }))
  }
  return result
})()

const isDesignDoc = designDocsNames => doc => {
  const [ prefix, designDocsName ] = Array.from(doc._id.split('/'))
  if (prefix !== '_design') return false
  // Design docs that aren't in the list aren't persisted:
  // this allows to have draft design docs in CouchDB that aren't worth
  // to be tracked by git without turning them into untracked files
  if (!designDocsNames.includes(designDocsName)) return false
  return true
}

const syncDesignDocFile = change => {
  const { id, doc } = change
  const designDocName = id.split('/')[1]
  const designDocPath = `${designDocFolder}/${designDocName}.json`

  const updatedDesignDoc = formatDesignDoc(doc)

  return fs_.readFile(designDocPath, { encoding: 'utf-8' })
  .then(file => {
    if (updatedDesignDoc === file) return
    return fs_.writeFile(designDocPath, updatedDesignDoc)
    .then(() => _.success(`${designDocName} design doc updated`))
  })
  .catch(_.Error(`${designDocName} design doc update err`))
}

const formatDesignDoc = doc => {
  // Design docs are persisted without their _rev
  doc = _.omit(doc, '_rev')
  return JSON.stringify(doc, null, 2)
}
