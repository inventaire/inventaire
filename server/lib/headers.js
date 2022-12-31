const separatorPattern = /\W/

export default {
  getLang: headers => {
    const acceptLanguage = headers['accept-language']
    if (acceptLanguage) return acceptLanguage.split(separatorPattern)[0]
  }
}
