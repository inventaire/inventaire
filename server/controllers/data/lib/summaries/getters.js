const summaryGettersByClaimProperty = {
  'wdt:P268': require('./bnf'),
  'wdt:P648': require('./openlibrary'),
}

const propertiesWithGetters = Object.keys(summaryGettersByClaimProperty)

const getSummaryFromPropertyClaims = ({ claims, refresh }) => async property => {
  const id = claims[property]?.[0]
  if (!id) return
  const summaryData = await summaryGettersByClaimProperty[property]({ id, refresh })
  if (!summaryData) return
  summaryData.key = property
  summaryData.claim = { id, property }
  return summaryData
}

const getSummariesFromClaims = async ({ claims, refresh }) => {
  return Promise.all(propertiesWithGetters.map(getSummaryFromPropertyClaims({ claims, refresh })))
}

module.exports = {
  getSummariesFromClaims,
}