const { compact } = require('lodash')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const { propertiesWithGetters, summaryGettersByClaimProperty } = require('controllers/data/lib/summaries/getters')
const { getSitelinkData, getSitelinkUrl } = require('wikidata-sdk')

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

const getSummariesFromClaims = async ({ claims, refresh }) => {
  return Promise.all(propertiesWithGetters.map(getSummaryFromPropertyClaims({ claims, refresh })))
}

const getSummaryFromPropertyClaims = ({ claims, refresh }) => property => {
  const claimValues = claims[property]
  if (claimValues) {
    return summaryGettersByClaimProperty[property]({ claimValues, refresh })
  }
}

const getWikipediaSitelinksData = sitelinks => {
  if (!sitelinks) return []
  return Object.entries(sitelinks).map(getWikipediaSummaryData)
}

const getWikipediaSummaryData = ([ key, title ]) => {
  const { lang, project } = getSitelinkData(key)
  if (project === 'wikipedia') {
    const link = getSitelinkUrl({ site: key, title })
    return {
      lang,
      source: 'Wikipedia',
      link,
      sitelink: {
        title,
        lang,
        key,
        project,
      },
    }
  }
}

module.exports = { sanitization, controller }
