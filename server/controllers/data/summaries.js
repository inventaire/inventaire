import { compact } from 'lodash-es'
import getEntityByUri from '#controllers/entities/lib/get_entity_by_uri'
import { getSummariesFromClaims } from '#controllers/data/lib/summaries/getters'
import { getWikipediaSitelinksData } from '#controllers/data/lib/summaries/sitelinks'

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

export default { sanitization, controller }
