module.exports =
  dbName: 'items'
  designDocName: 'items'
  viewName: 'byOwner'
  preview: true
  updateFunction: (doc)->
    doc.snapshot = {}
    return doc
