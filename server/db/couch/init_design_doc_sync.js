// Keep the design doc files in sync with CouchDB design docs
// once CouchDB design docs were updated to match the design doc files
// This allows to modify design docs in CouchDB GUI instead of having
// to change files manually, with all the formatting implied.
// This only make sense in development

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { readFile, writeFile } = require('fs').promises
const follow = __.require('lib', 'follow')
const dbsList = require('./list')
const designDocFolder = __.path('couchdb', 'design_docs')

module.exports = () => {
  if (!CONFIG.db.enableDesignDocSync) return
  // Wait for the end of the server initalization
  setTimeout(init, 2000)
}

const init = () => {
  for (const dbBaseName in dbsList) {
    const designDocsNames = dbsList[dbBaseName]
    follow({
      dbBaseName,
      filter: isDesignDoc(designDocsNames),
      onChange: _.debounce(syncDesignDocFile, 1000)
    })
  }
}

const isDesignDoc = designDocsNames => doc => {
  const [ prefix, designDocsName ] = doc._id.split('/')
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

  return readFile(designDocPath, { encoding: 'utf-8' })
  .then(file => {
    if (updatedDesignDoc === file) return
    return writeFile(designDocPath, updatedDesignDoc)
    .then(() => _.success(`${designDocName} design doc updated`))
  })
  .catch(_.Error(`${designDocName} design doc update err`))
}

const formatDesignDoc = doc => {
  // Design docs are persisted without their _rev
  doc = _.omit(doc, '_rev')
  return JSON.stringify(doc, null, 2)
}
