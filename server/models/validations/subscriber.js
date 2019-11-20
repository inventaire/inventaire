
const { pass, email } = require('./common')

module.exports = {
  pass,
  email,
  language: lang => /^\w{2}(-\w{2})?$/.test(lang)
}
