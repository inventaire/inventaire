const separatorPattern = /\W/

export const getLang = headers => {
  const acceptLanguage = headers['accept-language']
  if (acceptLanguage) return acceptLanguage.split(separatorPattern)[0]
}
