const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { typesAliases, typesNames, depreciatedAliases } = __.require('lib', 'wikidata/aliases')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  type: {
    whitelist: typesNames
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { type } = params
    const allAliases = typesAliases[type]
    return _.difference(allAliases, depreciatedAliases)
  })
  .then(responses_.Wrap(res, 'entity-type-aliases'))
  .catch(error_.Handler(req, res))
}
