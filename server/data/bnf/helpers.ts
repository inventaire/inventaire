import { compact, map, uniq } from 'lodash-es'
import { resolveExternalIds } from '#controllers/entities/lib/resolver/resolve_external_ids'
import { isWdEntityUri } from '#lib/boolean_validations'

export async function setEditionContributors (edition, property, urls) {
  const uris = await resolveContributors(urls)
  if (uris.length > 0) {
    edition.claims[property] = uris
  }
}

async function resolveContributors (urls) {
  const bnfIds = compact(uniq(urls.split(',')).map(extractBnfId))
  const uris = await Promise.all(bnfIds.map(resolve))
  return compact(uris)
}

const extractBnfId = url => url.split('/cb')[1]?.split('#')[0]

async function resolve (bnfId) {
  const results = await resolveExternalIds({ 'wdt:P268': [ bnfId ] })
  const uris = map(results, 'subject')
  if (uris.length === 1) return uris[0]
  // If one wd uri and some inv uris are found, consider that the inv uris are duplicates
  const wdUris = uris.filter(isWdEntityUri)
  if (wdUris.length === 1) return wdUris[0]
}
