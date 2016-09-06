const __ = require('config').universalPath
const pick = require('lodash').pick
const keep = ['_id', 'username', 'bio', 'position', 'language']
const publicAttributes = __.require('models', 'attributes/user').public

module.exports = function (doc) {
  if (doc.type === 'user') {
    return pick(doc, publicAttributes)
  }
}
