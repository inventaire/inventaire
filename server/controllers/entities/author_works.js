const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const authorWorks = require('./lib/get_author_works')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  uri: {},
  refresh: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { uri, refresh } = params

    return authorWorks({ uri, refresh })
    .then(responses_.Send(res))
  })
  .catch(error_.Handler(req, res))
}
