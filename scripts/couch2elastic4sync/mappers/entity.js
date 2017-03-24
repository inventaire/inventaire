module.exports = function (doc) {
  // Do not filter-out removed:placeholder so that changing an entity into
  // a removed placeholder does update the document in ElasticSearch
  // and can then be filtered-out at search time
  // Entity redirections keep the type 'entity' so no need of a specific rule
  if (doc.type === 'entity' || doc.type === 'removed:placeholder') {
    return doc
  }
}
