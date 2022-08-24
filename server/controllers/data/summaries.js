const { compact } = require('lodash')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const { getSummariesFromClaims } = require('controllers/data/lib/summaries/getters')
const { getWikipediaSitelinksData } = require('controllers/data/lib/summaries/sitelinks')

const sanitization = {
  uri: {},
  refresh: { optional: true },
}

const controller = async ({ uri, refresh }) => {
  const entity = await getEntityByUri({ uri, refresh })
  const { claims, sitelinks } = entity
  const externalIdsSummaries = await getSummariesFromClaims({ claims, refresh })
  const wikipediaSummaries = getWikipediaSitelinksData(sitelinks)
  const summaries = compact(externalIdsSummaries.concat(wikipediaSummaries))
  return { summaries }
}

module.exports = { sanitization, controller }
