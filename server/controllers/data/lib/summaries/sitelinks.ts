import { getSitelinkData, getSitelinkUrl } from 'wikibase-sdk'
import { someMatch } from '#lib/utils/base'
import { logError } from '#lib/utils/logs'

export function getWikipediaSitelinksData (sitelinks) {
  if (!sitelinks) return []
  return Object.entries(sitelinks).map(getWikipediaSummaryData)
}

function getWikipediaSummaryData ([ key, { title, badges } ]) {
  try {
    if (someMatch(badges, redirectionBadges)) return
    const { lang, project } = getSitelinkData(key)
    if (project === 'wikipedia') {
      const link = getSitelinkUrl({ site: key, title })
      return {
        key,
        name: `Wikipedia (${lang})`,
        lang,
        link,
        sitelink: {
          title,
          lang,
        },
      }
    }
  } catch (err) {
    // Do not crash the request for a "sitelink lang not found" error
    logError(err, 'getWikipediaSummaryData err')
  }
}

export const redirectionBadges = [
  'Q70893996', // sitelink to redirect
  'Q70894304', // intentional sitelink to redirect
] as const
