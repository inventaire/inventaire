const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const getArticle = require('./get_article')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  title: {},
  lang: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { lang, title } = params
    return getArticle({ lang, title, introOnly: true })
  })
  .then(data => {
    const { url, extract } = data
    return responses_.send(res, { url, extract })
  })
  .catch(error_.Handler(req, res))
}
