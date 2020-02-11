const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { unprefixify } = require('./lib/prefix')

const sanitization = {
  uri: { optional: true },
  id: { optional: true },
  lang: {},
  value: { type: 'string' }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    let { uri, id, value, lang } = params

    const prefix = getPrefix(uri, id)
    const updater = updaters[prefix]

    if (uri) id = unprefixify(uri)

    if (updater == null) {
      return error_.bundle(req, res, `unsupported uri prefix: ${prefix}`, 400, uri)
    }

    return updater(req.user, id, lang, value)
    .then(responses_.Ok(res))
  })
  .catch(error_.Handler(req, res))
}

const getPrefix = (uri, id) => {
  if (uri) return uri.split(':')[0]
  if (id) return 'inv'
}

const updaters = {
  inv: require('./lib/update_inv_label'),
  wd: require('./lib/update_wd_label')
}
