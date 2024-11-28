import { resolveEntrySeedsByExternalIds } from '#controllers/entities/lib/resolver/resolve_by_external_ids'
// BNB SPARQL service is currently suspended, see https://bnb.data.bl.uk/sparql:
// "The Linked Open BNB is moving to a new home in Spring 2022"
// import bnb from import('data/bnb/get_bnb_entry_from_isbn')
import bne from '#data/bne/get_bne_entry_from_isbn'
import bnf from '#data/bnf/get_bnf_entry_from_isbn'
import openlibrary from '#data/openlibrary/get_openlibrary_entry_from_isbn'
import wikidata from '#data/wikidata/get_wikidata_entry_from_isbn'
import { isArray } from '#lib/boolean_validations'
import { cache_ } from '#lib/cache'
import { oneMonth } from '#lib/time'
import { forceArray, isNotEmpty, objLength } from '#lib/utils/base'
import { logError } from '#lib/utils/logs'
import config from '#server/config'
import type { EntityLooseSeed, LooseClaims, ResolverEntry } from '#types/resolver'

const { offline } = config

const authorities = {
  // bnb,
  bne,
  bnf,
  openlibrary,
  wikidata,
}

const authoritiesNames = Object.keys(authorities)

export async function getAuthoritiesAggregatedEntry (isbn: string) {
  if (offline) return
  const maybeEntries = await Promise.all(authoritiesNames.map(wrap(isbn)))
  const entries = maybeEntries.filter<ResolverEntry>(isNotEmpty)
  return sortAndAggregateEntries(isbn, entries)
}

function wrap (isbn: string) {
  return async function (name: string): Promise<ResolverEntry | void> {
    try {
      return await cache_.get({
        key: `seed:${name}:${isbn}`,
        fn: () => authorities[name](isbn),
        ttl: oneMonth,
      })
    } catch (err) {
      logError(err, `${name} entry error`)
    }
  }
}

async function sortAndAggregateEntries (isbn: string, entries: ResolverEntry[]) {
  entries = entries.filter(isNotEmpty)
  if (entries.length === 0) return
  if (entries.length === 1) return entries[0]

  entries.forEach(entry => {
    entry.edition.isbn = isbn
  })

  await Promise.all(entries.map(resolveEntrySeedsByExternalIds))

  const scoredEntriesByResolvedEntities = entries
    .map(getEntryResolutionScore)
    .sort(byScore)

  const bestEntry = scoredEntriesByResolvedEntities.shift().entry

  scoredEntriesByResolvedEntities.forEach(({ entry }) => {
    const entryKeys = Object.keys(entry)
    entryKeys.forEach(parseEntry(entry, bestEntry))
  })

  return bestEntry
}

function getEntryResolutionScore (entry: ResolverEntry) {
  let score = 0
  if (entry.edition?.claims) score += objLength(entry.edition.claims)
  entry.works?.forEach(work => {
    if (work.uri) score += 100
    if (work.claims) score += objLength(work.claims)
  })
  entry.authors?.forEach(author => {
    if (author.uri) score += 20
    if (author.claims) score += objLength(author.claims)
  })
  return { entry, score }
}

const byScore = (a, b) => b.score - a.score

const parseEntry = (entry: ResolverEntry, bestEntry: ResolverEntry) => (entryKey: keyof ResolverEntry) => {
  const seeds = entry[entryKey]
  const bestEntrySeeds = bestEntry[entryKey]

  // Multiple authors or works must be ignored
  if (isArray(bestEntrySeeds) && bestEntrySeeds.length > 1) return
  if (isArray(seeds) && seeds.length > 1) return

  const seed: EntityLooseSeed = forceArray(seeds)[0]
  const bestEntrySeed: EntityLooseSeed = forceArray(bestEntrySeeds)[0]

  if (!seed?.claims) return

  if (!bestEntrySeed) {
    // @ts-expect-error
    bestEntry[entryKey] = entry[entryKey]
    return
  }

  bestEntrySeed.claims ??= {}

  addSeedClaimsToBestEntrySeedClaims(seed.claims, bestEntrySeed.claims)
}

function addSeedClaimsToBestEntrySeedClaims (seedClaims: LooseClaims, bestEntrySeedClaims: LooseClaims) {
  for (const property of Object.keys(seedClaims)) {
    bestEntrySeedClaims[property] ??= seedClaims[property]
  }
}
