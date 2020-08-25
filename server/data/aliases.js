const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const { typesAliases, typesNames } = __.require('lib', 'wikidata/aliases')
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
    return res.json(typesAliases[type])
  })
  .catch(error_.Handler(req, res))
}
