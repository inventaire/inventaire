const _ = require('builders/utils')
const { resolveEntrySeedsByExternalIds } = require('controllers/entities/lib/resolver/resolve_by_external_ids')
const { isNotEmpty, objLength } = require('lib/utils/base')

const authorities = {
  bnb: require('data/bnb/get_bnb_entry_from_isbn'),
  bne: require('data/bne/get_bne_entry_from_isbn'),
  bnf: require('data/bnf/get_bnf_entry_from_isbn'),
  wikidata: require('data/wikidata/get_wikidata_entry_from_isbn'),
}

const authoritiesNames = Object.keys(authorities)

module.exports = async isbn => {
  const entries = await Promise.all(authoritiesNames.map(wrap(isbn)))
  return sortAndAggregateEntries(isbn, entries)
}

const wrap = isbn => async name => {
  try {
    return await authorities[name](isbn)
  } catch (err) {
    _.error(err, `${name} entry error`)
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

  entries.forEach(entry => {
    const entryKeys = Object.keys(entry)
    if (_.isNonEmptyArray(entryKeys)) entryKeys.forEach(parseEntry(entry, bestEntry))
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
  if (!bestEntry?.claims || !bestEntryValue?.claims) return
  if (_.isNonEmptyArray(bestEntryValue) && bestEntryValue.length > 1) return
  if (_.isNonEmptyArray(entryValue) && entryValue.length > 1) return

  if (entryKey !== 'edition') {
    entryValue = entryValue[0]
    if (bestEntryValue) bestEntryValue = bestEntryValue[0]
  }
  const entryClaims = bestEntry.claims
  const bestEntryClaims = bestEntryValue.claims
  // multiple authors or works must be ignored
  const claimsKeys = Object.keys(entryClaims)
  claimsKeys.forEach(addClaimToBestEntry(entryClaims, bestEntryClaims))
  bestEntryValue = _.forceArray(bestEntryValue)
}

const addClaimToBestEntry = (subentryClaims, bestSubentryClaims) => claimKey => {
  if (!bestSubentryClaims[claimKey]) {
    bestSubentryClaims[claimKey] = subentryClaims[claimKey]
  }
}
