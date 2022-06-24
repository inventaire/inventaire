const getArticle = require('data/wikipedia/get_article')

const sanitization = {
  title: {},
  lang: {}
}

const controller = async ({ lang, title }) => {
  return getArticle({ lang, title, introOnly: true })
}

module.exports = { sanitization, controller }
