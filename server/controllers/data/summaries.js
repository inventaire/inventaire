const { keyBy, compact } = require('lodash')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const { propertiesWithGetters, summaryGettersByClaimProperty } = require('controllers/data/lib/summaries_getters')

const sanitization = {
  uri: {},
  refresh: { optional: true },
}

const controller = async ({ uri, refresh }) => {
  const entity = await getEntityByUri({ uri, refresh })
  const { claims } = entity
  const summaries = await getSummariesFromClaims({ claims, refresh })
  return {
    summaries: keyBy(compact(summaries), 'source')
  }
}

const getSummariesFromClaims = async ({ claims, refresh }) => {
  return Promise.all(propertiesWithGetters.map(getSummaryFromPropertyClaims({ claims, refresh })))
}

const getSummaryFromPropertyClaims = ({ claims, refresh }) => property => {
  const claimValues = claims[property]
  if (claimValues) {
    return summaryGettersByClaimProperty[property]({ claimValues, refresh })
  }
}

module.exports = { sanitization, controller }
