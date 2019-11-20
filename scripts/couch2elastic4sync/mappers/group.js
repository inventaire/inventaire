module.exports = doc => {
  // Do not filter-out doc.searchable=false so that toggling this settings
  // does update the document in ElasticSearch and can then be filtered-out
  // at search time
  if (doc.type === 'group') return doc
}
