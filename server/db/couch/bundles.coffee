module.exports = (db, _)->
  actionAndReturn = (verb, doc)->
    _.type doc, 'object'
    db[verb](doc)
    .then updateIdAndRev.bind(null, doc)

  return bundles =
    postAndReturn: actionAndReturn.bind(null, 'post')
    putAndReturn: actionAndReturn.bind(null, 'put')

updateIdAndRev = (doc, couchRes)->
  doc._id or= couchRes.id
  doc._rev = couchRes.rev
  return doc
