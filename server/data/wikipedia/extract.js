const __ = require('config').universalPath
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const getArticle = require('./get_article')
const sanitize = require('lib/sanitize/sanitize')

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
    responses_.send(res, { url, extract })
  })
  .catch(error_.Handler(req, res))
}
