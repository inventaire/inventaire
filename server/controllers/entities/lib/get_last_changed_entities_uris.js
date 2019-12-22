const __ = require('config').universalPath
const db = __.require('couch', 'base')('entities')
const getInvUriFromDoc = require('./get_inv_uri_from_doc')

module.exports = (since, limit) => {
  return db.changes({
    filter: 'entities/entities:only',
    limit,
    since,
    include_docs: true,
    descending: true
  })
  .then(res => ({
    uris: res.results.map(parseDoc),
    lastSeq: res.last_seq
  }))
}

const parseDoc = result => {
  const { doc: entity } = result
  return getInvUriFromDoc(entity)
}
