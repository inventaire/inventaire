const __ = require('config').universalPath
const sanitize = __.require('lib', 'sanitize/sanitize')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const getEntitiesByUris = require('./lib/get_entities_by_uris')
const addRelatives = require('./lib/add_relatives')

const validRelativesProperties = [
  'wdt:P50',
  'wdt:P179',
  'wdt:P629'
]

const sanitization = {
  uris: {},
  refresh: { optional: true },
  relatives: {
    allowlist: validRelativesProperties,
    optional: true
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { uris, refresh, relatives } = params
    return getEntitiesByUris({ uris, refresh })
    .then(addRelatives(relatives, refresh))
  })
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}
