const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
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
    const activeAliases = _.difference(allAliases, depreciatedAliases)
    return res.json(activeAliases)
  })
  .catch(error_.Handler(req, res))
}
