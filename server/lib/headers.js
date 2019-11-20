module.exports = {
  getLang: headers => {
    const acceptLanguage = headers['accept-language']
    if (acceptLanguage) return acceptLanguage.split(/\W/)[0]
  }
}
