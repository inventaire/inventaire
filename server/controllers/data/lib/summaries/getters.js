import { logError } from '#lib/utils/logs'
import bnf from './bnf.js'
import { getOpenLibrarySummaryByIsbn, getOpenLibrarySummaryByOpenLibraryId } from './openlibrary.js'

const summaryGettersByClaimProperty = {
  'wdt:P212': getOpenLibrarySummaryByIsbn,
  'wdt:P268': bnf,
  'wdt:P648': getOpenLibrarySummaryByOpenLibraryId,
}

const propertiesWithGetters = Object.keys(summaryGettersByClaimProperty)

const getSummaryFromPropertyClaims = ({ claims, refresh }) => async property => {
  const id = claims[property]?.[0]
  if (!id) return
  let summaryData
  try {
    summaryData = await summaryGettersByClaimProperty[property]({ id, refresh })
  } catch (err) {
    err.context = { id, property }
    logError(err, 'getSummaryFromPropertyClaims')
    return
  }
  if (!summaryData) return
  summaryData.key = property
  summaryData.claim = { id, property }
  return summaryData
}

export const getSummariesFromClaims = async ({ claims, refresh }) => {
  return Promise.all(propertiesWithGetters.map(getSummaryFromPropertyClaims({ claims, refresh })))
}
