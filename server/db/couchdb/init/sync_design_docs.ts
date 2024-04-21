import fetch from 'node-fetch'
import { objectPromise } from '#lib/promises'
import { couchdbError } from './couchdb_error.js'

// This verifies that the database design documents are up-to-date
// with the design docs files
export async function syncDesignDocs (dbUrl, designDocs) {
  const ops = {}
  for (const [ designDocName, designDocViews ] of Object.entries(designDocs)) {
    ops[designDocName] = syncDesignDoc(dbUrl, designDocName, designDocViews)
  }
  return objectPromise(ops)
}

async function syncDesignDoc (dbUrl, designDocName, designDocViews) {
  const designDocId = `_design/${designDocName}`
  const designDocUrl = `${dbUrl}/${designDocId}`
  let currentDesignDoc, created
  const res = await fetch(designDocUrl)
  if (res.status === 200) {
    currentDesignDoc = await res.json()
  } else if (res.status === 404) {
    // pass an empty document to trigger a document update
    currentDesignDoc = {}
    created = true
  } else {
    throw new Error(`${res.status}: ${res.statusText}`)
  }
  const designDoc = getStringifiedDesignDoc(designDocName, designDocViews)
  const op = await updateDesignDoc(designDoc, currentDesignDoc, designDocUrl)
  if (created) return { created }
  else return op
}

export function getStringifiedDesignDoc (designDocName, designDocViews) {
  const designDoc = {
    _id: `_design/${designDocName}`,
    language: 'javascript',
    views: designDocViews,
  }
  for (const view of Object.values(designDoc.views)) {
    stringifyViewFunction(view, 'map')
    stringifyViewFunction(view, 'reduce')
  }
  return JSON.stringify(designDoc)
}

function stringifyViewFunction (view, fnName) {
  if (view[fnName] == null) return
  if (view[fnName] instanceof Array) {
    view[fnName] = view[fnName].map(stringifyFunction).join('\n')
  } else {
    view[fnName] = stringifyFunction(view[fnName])
  }
}

function stringifyFunction (fn) {
  return fn
  .toString()
  .trim()
  .split('\n')
  // Drop comments
  .filter(line => !line.trim().startsWith('//'))
  .join('\n')
}

async function updateDesignDoc (designDocParams, currentDesignDoc, designDocUrl) {
  const rev = currentDesignDoc && currentDesignDoc._rev

  // Delete the rev to be able to compare object
  delete currentDesignDoc._rev

  // designDocParams should be a stringified object
  const currentDesignDocStr = JSON.stringify(currentDesignDoc)
  if (typeof designDocParams !== 'string') designDocParams = JSON.stringify(designDocParams)

  // Comparison is made without spaces to avoid false negative
  if (removeSpaces(designDocParams) === removeSpaces(currentDesignDocStr)) return { updated: false }

  const update = JSON.parse(designDocParams)
  update._rev = rev

  const res = await fetch(designDocUrl, {
    method: 'PUT',
    body: JSON.stringify(update),
  })

  if (res.status !== 201) {
    throw (await couchdbError(res, { designDocParams, currentDesignDoc, designDocUrl }))
  }

  return { updated: true }
}

const removeSpaces = string => string.replace(/\s/g, '')
