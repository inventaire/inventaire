
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
