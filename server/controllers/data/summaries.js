const { compact } = require('lodash')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const { getSummariesFromClaims } = require('controllers/data/lib/summaries/getters')
const { getWikipediaSitelinksData } = require('controllers/data/lib/summaries/sitelinks')

const sanitization = {
  uri: {},
  refresh: { optional: true },
  langs: { optional: true },
}

const controller = async ({ uri, refresh, langs }) => {
  const entity = await getEntityByUri({ uri, refresh })
  const { claims, sitelinks } = entity
  const externalIdsSummaries = await getSummariesFromClaims({ claims, refresh })
  const wikipediaSummaries = getWikipediaSitelinksData(sitelinks)
  let summaries = compact(externalIdsSummaries.concat(wikipediaSummaries))
  if (langs) {
    summaries = summaries.filter(summary => langs.includes(summary.lang))
  }
  return { summaries }
}

module.exports = { sanitization, controller }
