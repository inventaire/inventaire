const pick = require('lodash').pick
const keep = ['_id', 'username', 'bio', 'position', 'language']

module.exports = function (doc) {
  if (doc.type === 'user') {
    doc = pick(doc, keep)
    return doc
  }
}
