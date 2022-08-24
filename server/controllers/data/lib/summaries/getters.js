const summaryGettersByClaimProperty = {
  'wdt:P268': require('./bnf'),
  'wdt:P648': require('./openlibrary'),
}

const propertiesWithGetters = Object.keys(summaryGettersByClaimProperty)

module.exports = {
  summaryGettersByClaimProperty,
  propertiesWithGetters,
}
