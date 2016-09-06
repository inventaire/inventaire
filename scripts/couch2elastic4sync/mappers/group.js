module.exports = function (doc) {
  if (doc.type === 'group' && doc.searchable) {
    return doc
  }
}
