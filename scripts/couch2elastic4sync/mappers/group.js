const pick = require('lodash').pick
const keep = ['_id', 'name', 'description', 'position']

module.exports = function (doc) {
  if (doc.type === 'group' && doc.searchable) {
    doc = pick(doc, keep)
    return doc
  }
}
