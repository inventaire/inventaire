
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const { IncomingForm } = require('formidable')
const { Promise } = __.require('lib', 'promises')

module.exports = req => {
  const form = new IncomingForm()

  return new Promise((resolve, reject) => form.parse(req, (err, fields, files) => {
    if (err != null) reject(err)
    else resolve({ fields, files })
  }))
}
