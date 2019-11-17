// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
module.exports = {
  dbName: 'items',
  designDocName: 'items',
  viewName: 'byOwnerAndEntityAndListing',
  preview: true,
  updateFunction: doc => {
    doc.snapshot = {}
    return doc
  }
}
