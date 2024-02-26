import { logError } from '#lib/utils/logs'
import { getBnfSummary } from './bnf.js'
import { getOpenLibrarySummary } from './openlibrary.js'

const getters = [
  getBnfSummary,
  getOpenLibrarySummary,
]

const getSummaryFromPropertyClaims = ({ claims, refresh }) => async getter => {
  let summaryData
  try {
    summaryData = await getter({ claims, refresh })
  } catch (err) {
    if (err.statusCode !== 404) {
      err.context = { getter }
      logError(err, 'getSummaryFromPropertyClaims')
    }
    return
  }
  return summaryData
}

export async function getSummariesFromClaims ({ claims, refresh }) {
  return Promise.all(getters.map(getSummaryFromPropertyClaims({ claims, refresh })))
}
