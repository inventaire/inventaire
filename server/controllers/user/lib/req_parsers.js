const CONFIG = require('config')
const __ = CONFIG.universalPath
const User = __.require('models', 'user')

module.exports = {
  findLanguage: req => {
    const accept = req.headers['accept-language']
    const language = accept && accept.split(',')[0]
    if (User.validations.language(language)) return language
  }
}
