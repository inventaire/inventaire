module.exports =
  dbName: 'items'
  designDocName: 'items'
  viewName: 'byOwnerAndEntityAndListing'
  preview: true
  updateFunction: (doc)->
    doc.snapshot = {}
    return doc
