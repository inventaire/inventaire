const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const checkEntity = require('./lib/check_entity')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  uris: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { uris } = params
    return Promise.all(uris.map(checkEntity))
  })
  .then(_.flatten)
  .then(responses_.Wrap(res, 'tasks'))
  .catch(error_.Handler(req, res))
}
