import { compact } from 'lodash-es'
import { getSummariesFromClaims } from '#controllers/data/lib/summaries/getters'
import { getWikipediaSitelinksData } from '#controllers/data/lib/summaries/sitelinks'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'

const sanitization = {
  uri: {},
  refresh: { optional: true },
  langs: { type: 'wikimedia', optional: true },
}

async function controller ({ uri, refresh, langs }) {
  const entity = await getEntityByUri({ uri, refresh })
  const { claims } = entity
  const sitelinks = 'sitelinks' in entity ? entity.sitelinks : {}
  const externalIdsSummaries = await getSummariesFromClaims({ claims, refresh })
  const wikipediaSummaries = getWikipediaSitelinksData(sitelinks)
  let summaries = compact(externalIdsSummaries.concat(wikipediaSummaries))
  if (langs) {
    summaries = summaries.filter(summary => langs.includes(summary.lang))
  }
  return { summaries }
}

export default { sanitization, controller }
