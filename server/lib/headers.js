// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  getLang: headers => {
    const acceptLanguage = headers['accept-language']
    if (acceptLanguage) return acceptLanguage.split(/\W/)[0]
  }
}
