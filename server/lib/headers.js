const separatorPattern = /\W/

module.exports = {
  getLang: headers => {
    const acceptLanguage = headers['accept-language']
    if (acceptLanguage) return acceptLanguage.split(separatorPattern)[0]
  }
}
