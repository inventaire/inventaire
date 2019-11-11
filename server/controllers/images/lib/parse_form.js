// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const { IncomingForm } = require('formidable')
const { Promise } = __.require('lib', 'promises')

module.exports = function(req){
  const form = new IncomingForm()

  return new Promise((resolve, reject) => form.parse(req, (err, fields, files) => {
    if (err != null) { return reject(err)
    } else { return resolve({ fields, files }) }
  }))
}
