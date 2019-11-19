// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const { pass, email } = require('./common')

module.exports = {
  pass,
  email,
  language: lang => /^\w{2}(-\w{2})?$/.test(lang)
}
