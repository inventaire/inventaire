const { keyBy, compact } = require('lodash')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const { propertiesWithGetters, summaryGettersByClaimProperty } = require('controllers/data/lib/summaries_getters')

const sanitization = {
  uri: {}
}

const controller = async ({ uri }) => {
  const entity = await getEntityByUri({ uri })
  const summaries = await getSummariesFromClaims(entity.claims)
  return {
    summaries: keyBy(compact(summaries), 'source')
  }
}

const getSummariesFromClaims = async claims => {
  return Promise.all(propertiesWithGetters.map(getSummaryFromPropertyClaims(claims)))
}

const getSummaryFromPropertyClaims = claims => property => {
  const claimValues = claims[property]
  if (claimValues) {
    return summaryGettersByClaimProperty[property](claimValues)
  }
}

module.exports = { sanitization, controller }
