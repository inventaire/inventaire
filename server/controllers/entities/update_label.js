const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const sanitize = require('lib/sanitize/sanitize')
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

    if (value === '') throw error_.new('invalid value', 400, params)

    if (updater == null) {
      throw error_.new(`unsupported uri prefix: ${prefix}`, 400, params)
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
