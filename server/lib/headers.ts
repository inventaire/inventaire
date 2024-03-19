const separatorPattern = /\W/

export function getLangFromHeaders (headers) {
  const acceptLanguage = headers['accept-language']
  if (acceptLanguage) return acceptLanguage.split(separatorPattern)[0]
}
