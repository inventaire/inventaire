const pick = require('lodash').pick

module.exports = function (doc) {
  if (doc.type === 'entity') {
    doc = pick(doc, ['_id', 'labels', 'bio'])
    return doc
  }
}
