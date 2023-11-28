import CONFIG from 'config'
import { resolveEntrySeedsByExternalIds } from '#controllers/entities/lib/resolver/resolve_by_external_ids'
// BNB SPARQL service is currently suspended, see https://bnb.data.bl.uk/sparql:
// "The Linked Open BNB is moving to a new home in Spring 2022"
// import bnb from import('data/bnb/get_bnb_entry_from_isbn')
import bne from '#data/bne/get_bne_entry_from_isbn'
import bnf from '#data/bnf/get_bnf_entry_from_isbn'
import wikidata from '#data/wikidata/get_wikidata_entry_from_isbn'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { isNotEmpty, objLength } from '#lib/utils/base'
import { logError } from '#lib/utils/logs'

const { offline } = CONFIG

const authorities = {
  // bnb,
  bne,
  bnf,
  wikidata,
}

const authoritiesNames = Object.keys(authorities)

export async function getAuthoritiesAggregatedEntry (isbn) {
  if (offline) return
  const entries = await Promise.all(authoritiesNames.map(wrap(isbn)))
  return sortAndAggregateEntries(isbn, entries)
}

const wrap = isbn => async name => {
  try {
    return await authorities[name](isbn)
  } catch (err) {
    logError(err, `${name} entry error`)
  }
}

const sortAndAggregateEntries = async (isbn, entries) => {
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

const getEntryResolutionScore = entry => {
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

const parseEntry = (entry, bestEntry) => entryKey => {
  let entryValue = entry[entryKey]
  let bestEntryValue = bestEntry[entryKey]

  // Multiple authors or works must be ignored
  if (isNonEmptyArray(bestEntryValue) && bestEntryValue.length > 1) return
  if (isNonEmptyArray(entryValue) && entryValue.length > 1) return

  if (entryKey !== 'edition') {
    entryValue = entryValue[0]
    if (bestEntryValue) bestEntryValue = bestEntryValue[0]
  }

  if (!entryValue?.claims) return

  if (!bestEntryValue) {
    bestEntry[entryKey] = entry[entryKey]
    return
  }

  const entryClaims = entryValue.claims
  const bestEntryClaims = bestEntryValue.claims
  const claimsKeys = Object.keys(entryClaims)
  claimsKeys.forEach(addClaimToBestEntry(entryClaims, bestEntryClaims))
}

const addClaimToBestEntry = (subentryClaims, bestSubentryClaims) => claimKey => {
  if (!bestSubentryClaims[claimKey]) {
    bestSubentryClaims[claimKey] = subentryClaims[claimKey]
  }
}
